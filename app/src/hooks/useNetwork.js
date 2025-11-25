import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../config/firebase';
import { ref, set, onValue, push, remove, onDisconnect, serverTimestamp } from 'firebase/database';

export const useNetwork = () => {
    const [peerId, setPeerId] = useState(null); // We'll use this as "Room ID"
    const [connectedTeams, setConnectedTeams] = useState({});
    const [isHost, setIsHost] = useState(false);

    // Callback ref
    const onDataReceivedRef = useRef(null);
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

    // Initialize Host (Create Room)
    const initializeHost = useCallback(() => {
        const roomId = generateRoomId();
        setPeerId(roomId);
        setIsHost(true);

        const roomRef = ref(db, `games/${roomId}`);
        const actionsRef = ref(db, `games/${roomId}/actions`);
        const presenceRef = ref(db, `games/${roomId}/host`);

        // Set host presence
        set(presenceRef, { online: true, timestamp: serverTimestamp() });
        onDisconnect(presenceRef).remove();
        onDisconnect(roomRef).remove(); // Optional: Delete room when host leaves? Maybe keep it for refresh.

        // Listen for actions from clients
        const unsubscribe = onValue(actionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Iterate over actions (since it's a list)
                Object.entries(data).forEach(([key, actionData]) => {
                    if (onDataReceivedRef.current) {
                        onDataReceivedRef.current(actionData, actionData.sender);
                    }
                    // Remove processed action
                    remove(ref(db, `games/${roomId}/actions/${key}`));
                });
            }
        });

        return () => {
            unsubscribe();
            remove(roomRef);
        };
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
        setIsHost
    };
};
