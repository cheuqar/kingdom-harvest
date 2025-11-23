import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export const useNetwork = () => {
    const [peerId, setPeerId] = useState(null);
    const [connections, setConnections] = useState({}); // Map peerId -> conn
    const [hostConnection, setHostConnection] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedTeams, setConnectedTeams] = useState({}); // Map teamIndex -> peerId
    const peerRef = useRef(null);

    // Initialize Peer
    const initializePeer = useCallback(() => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My Peer ID is: ' + id);
            setPeerId(id);
        });

        peer.on('connection', (conn) => {
            handleIncomingConnection(conn);
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
        });

        return peer;
    }, []);

    const handleIncomingConnection = (conn) => {
        conn.on('open', () => {
            console.log('Incoming connection from:', conn.peer);
            setConnections(prev => ({ ...prev, [conn.peer]: conn }));
        });

        conn.on('data', (data) => {
            console.log('Received data:', data);
            // Events will be handled by the consumer of this hook via a callback
            if (onDataReceivedRef.current) {
                onDataReceivedRef.current(data, conn.peer);
            }
        });

        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            setConnections(prev => {
                const newConns = { ...prev };
                delete newConns[conn.peer];
                return newConns;
            });
            // Also remove from connectedTeams if present
            setConnectedTeams(prev => {
                const newTeams = { ...prev };
                Object.keys(newTeams).forEach(key => {
                    if (newTeams[key] === conn.peer) {
                        delete newTeams[key];
                    }
                });
                return newTeams;
            });
        });
    };

    const connectToHost = (hostId) => {
        if (!peerRef.current) initializePeer();

        const conn = peerRef.current.connect(hostId);

        conn.on('open', () => {
            console.log('Connected to host:', hostId);
            setHostConnection(conn);
        });

        conn.on('data', (data) => {
            if (onDataReceivedRef.current) {
                onDataReceivedRef.current(data, 'HOST');
            }
        });

        conn.on('close', () => {
            console.log('Disconnected from host');
            setHostConnection(null);
        });

        return conn;
    };

    const sendToHost = (data) => {
        if (hostConnection && hostConnection.open) {
            hostConnection.send(data);
        }
    };

    const broadcast = (data) => {
        Object.values(connections).forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    };

    const sendToPeer = (peerId, data) => {
        const conn = connections[peerId];
        if (conn && conn.open) {
            conn.send(data);
        }
    };

    // Callback ref pattern to avoid stale closures in event listeners
    const onDataReceivedRef = useRef(null);
    const setOnDataReceived = (callback) => {
        onDataReceivedRef.current = callback;
    };

    // Admin functions
    const registerTeamDevice = (teamIndex, peerId) => {
        setConnectedTeams(prev => ({ ...prev, [teamIndex]: peerId }));
    };

    const disconnectTeam = (teamIndex) => {
        const peerId = connectedTeams[teamIndex];
        if (peerId && connections[peerId]) {
            connections[peerId].close();
        }
        setConnectedTeams(prev => {
            const newTeams = { ...prev };
            delete newTeams[teamIndex];
            return newTeams;
        });
    };

    return {
        peerId,
        initializePeer,
        connectToHost,
        sendToHost,
        broadcast,
        sendToPeer,
        setOnDataReceived,
        connections,
        hostConnection,
        connectedTeams,
        registerTeamDevice,
        disconnectTeam,
        setIsHost
    };
};
