import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../config/firebase';
import { ref, set, get, onValue, push, remove, onDisconnect, serverTimestamp } from 'firebase/database';

const ROOM_ID_KEY = 'monopoly-room-id';

export const useNetwork = () => {
    const [peerId, setPeerId] = useState(null); // We'll use this as "Room ID"
    const [connectedTeams, setConnectedTeams] = useState({});
    const [isHost, setIsHost] = useState(false);
    const [connectionState, setConnectionState] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'

    // Callback ref
    const onDataReceivedRef = useRef(null);
    const unsubscribeRef = useRef(null);

    const setOnDataReceived = (callback) => {
        onDataReceivedRef.current = callback;
    };

    // Generate a random 6-character Room ID
    const generateRoomId = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Setup host listeners for a given room
    const setupHostListeners = useCallback((roomId) => {
        const actionsRef = ref(db, `games/${roomId}/actions`);
        const presenceRef = ref(db, `games/${roomId}/host`);
        const teamsRef = ref(db, `games/${roomId}/teams`);

        // Set host presence (only update presence, don't delete room on disconnect)
        set(presenceRef, { online: true, timestamp: serverTimestamp() });
        onDisconnect(presenceRef).set({ online: false, lastSeen: serverTimestamp() });

        // Listen for actions from clients
        const actionsUnsubscribe = onValue(actionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                Object.entries(data).forEach(([key, actionData]) => {
                    if (onDataReceivedRef.current) {
                        onDataReceivedRef.current(actionData, actionData.sender);
                    }
                    remove(ref(db, `games/${roomId}/actions/${key}`));
                });
            }
        });

        // Restore connected teams from DB
        get(teamsRef).then((snapshot) => {
            const teamsData = snapshot.val();
            if (teamsData) {
                const restoredTeams = {};
                Object.entries(teamsData).forEach(([teamIndex, teamData]) => {
                    if (teamData.deviceId) {
                        restoredTeams[teamIndex] = teamData.deviceId;
                    }
                });
                if (Object.keys(restoredTeams).length > 0) {
                    setConnectedTeams(restoredTeams);
                    console.log('[useNetwork] Restored connected teams:', restoredTeams);
                }
            }
        });

        setConnectionState('connected');

        return actionsUnsubscribe;
    }, []);

    // Initialize Host (Create Room)
    const initializeHost = useCallback(() => {
        const roomId = generateRoomId();
        setPeerId(roomId);
        setIsHost(true);
        setConnectionState('connecting');

        // Persist room ID
        localStorage.setItem(ROOM_ID_KEY, roomId);
        console.log('[useNetwork] Created room:', roomId);

        const unsubscribe = setupHostListeners(roomId);
        unsubscribeRef.current = unsubscribe;

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [setupHostListeners]);

    // Restore Host (Rejoin existing room)
    const restoreHost = useCallback(async (savedRoomId) => {
        console.log('[useNetwork] Attempting to restore room:', savedRoomId);
        setConnectionState('connecting');

        try {
            // Check if room still exists in Firebase
            const roomRef = ref(db, `games/${savedRoomId}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                console.log('[useNetwork] Room exists, restoring...');
                setPeerId(savedRoomId);
                setIsHost(true);
                localStorage.setItem(ROOM_ID_KEY, savedRoomId);

                const unsubscribe = setupHostListeners(savedRoomId);
                unsubscribeRef.current = unsubscribe;

                return { success: true, roomId: savedRoomId };
            } else {
                console.log('[useNetwork] Room does not exist, creating new one');
                // Room doesn't exist, create a new one
                initializeHost();
                return { success: false, reason: 'room_not_found' };
            }
        } catch (error) {
            console.error('[useNetwork] Error restoring room:', error);
            setConnectionState('disconnected');
            return { success: false, reason: 'error', error };
        }
    }, [setupHostListeners, initializeHost]);

    // Get saved room ID
    const getSavedRoomId = useCallback(() => {
        return localStorage.getItem(ROOM_ID_KEY);
    }, []);

    // Clear saved room ID
    const clearSavedRoom = useCallback(() => {
        localStorage.removeItem(ROOM_ID_KEY);
    }, []);

    const [clientId] = useState(() => 'client_' + Math.random().toString(36).substr(2, 9));
    const hostConnRef = useRef(null);

    // Connect Client (Join Room)
    const connectToHost = (roomId) => {
        console.log('[useNetwork] Connecting to room:', roomId);
        // Listen for Game State
        const stateRef = ref(db, `games/${roomId}/state`);

        const unsubscribe = onValue(stateRef, (snapshot) => {
            const state = snapshot.val();
            if (state) {
                if (onDataReceivedRef.current) {
                    // Simulate SYNC_STATE message
                    onDataReceivedRef.current({ type: 'SYNC_STATE', state }, 'HOST');
                } else {
                    console.warn('[useNetwork] Received state but no handler set!');
                }
            }
        });

        const conn = {
            send: (data) => {
                // Send action/request to Host
                console.log('[useNetwork] Sending action:', data.type);
                const actionsRef = ref(db, `games/${roomId}/actions`);
                push(actionsRef, { ...data, sender: clientId, timestamp: serverTimestamp() });
            },
            close: unsubscribe
        };

        hostConnRef.current = conn;
        return conn;
    };

    const sendToHost = (data) => {
        if (hostConnRef.current) {
            hostConnRef.current.send(data);
        } else {
            console.error("Cannot send to host: No connection");
        }
    };

    // Host: Broadcast State
    const broadcast = (data) => {
        if (!peerId) return;
        if (data.type === 'SYNC_STATE') {
            const stateRef = ref(db, `games/${peerId}/state`);
            set(stateRef, data.state);
        }
    };

    // Host: Send to specific peer (Not strictly needed in FB model, usually we just update state)
    // But for JOIN_ACCEPTED, we can write to a specific path or just rely on state sync.
    // For simplicity, let's assume state sync handles everything.
    // But we need to handle "Join Request".

    // In Firebase model:
    // 1. Client pushes JOIN_REQUEST to actions.
    // 2. Host sees it, updates "connectedTeams" in local state (and maybe in DB).
    // 3. Host broadcasts new state.
    // 4. Client sees new state with them in it.

    const sendToPeer = (targetId, data) => {
        // Not implemented for Firebase broadcast model
        // We rely on global state sync
    };

    const registerTeamDevice = (teamIndex, deviceId) => {
        setConnectedTeams(prev => ({ ...prev, [teamIndex]: deviceId }));
        // Optionally write to DB
        set(ref(db, `games/${peerId}/teams/${teamIndex}`), { deviceId, online: true });
    };

    const disconnectTeam = (teamIndex) => {
        setConnectedTeams(prev => {
            const newTeams = { ...prev };
            delete newTeams[teamIndex];
            return newTeams;
        });
        remove(ref(db, `games/${peerId}/teams/${teamIndex}`));
    };

    // Compatibility shim for existing code
    const initializePeer = initializeHost;

    return {
        peerId, // This is now Room ID
        initializePeer,
        connectToHost,
        sendToHost,
        broadcast,
        sendToPeer,
        setOnDataReceived,
        connections: {}, // Not used in Firebase
        hostConnection: { open: true }, // Always "open" for Firebase
        connectedTeams,
        registerTeamDevice,
        disconnectTeam,
        setIsHost,
        // New reconnection features
        connectionState,
        restoreHost,
        getSavedRoomId,
        clearSavedRoom
    };
};
