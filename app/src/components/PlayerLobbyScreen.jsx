import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import './PlayerLobbyScreen.css';

const TEAM_COLORS = ['#e94560', '#4ecca3', '#3282b8', '#f1c40f'];

const PlayerLobbyScreen = ({ roomId, teamIndex, deviceId, onGameStart, onKicked }) => {
    const [lobbyPlayers, setLobbyPlayers] = useState({});
    const [config, setConfig] = useState({});
    const [hostOnline, setHostOnline] = useState(false);
    const [kicked, setKicked] = useState(false);
    const [roomCancelled, setRoomCancelled] = useState(false);

    const teamCount = config.teamNames?.length || 2;
    const teamNames = config.teamNames || Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`);
    const teamColors = config.teamColors || TEAM_COLORS.slice(0, teamCount);
    const myTeamName = teamNames[teamIndex] || `Team ${teamIndex + 1}`;
    const myTeamColor = teamColors[teamIndex] || TEAM_COLORS[teamIndex % TEAM_COLORS.length];

    // Register in lobby when component mounts
    useEffect(() => {
        const registerInLobby = async () => {
            await set(ref(db, `games/${roomId}/lobby/${teamIndex}`), {
                deviceId,
                connected: true,
                joinedAt: serverTimestamp()
            });
        };

        registerInLobby();

        // Cleanup on unmount - mark as disconnected
        return () => {
            set(ref(db, `games/${roomId}/lobby/${teamIndex}/connected`), false);
        };
    }, [roomId, teamIndex, deviceId]);

    // Listen for config updates
    useEffect(() => {
        const configRef = ref(db, `games/${roomId}/config`);
        const unsubscribe = onValue(configRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setConfig(data);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Listen for lobby updates (to show other connected players)
    useEffect(() => {
        const lobbyRef = ref(db, `games/${roomId}/lobby`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            const data = snapshot.val() || {};
            setLobbyPlayers(data);
        });

        return () => unsubscribe();
    }, [roomId]);

    // Listen for host presence
    useEffect(() => {
        const hostRef = ref(db, `games/${roomId}/host`);
        const unsubscribe = onValue(hostRef, (snapshot) => {
            const data = snapshot.val();
            setHostOnline(data?.online || false);
        });

        return () => unsubscribe();
    }, [roomId]);

    // Listen for game status (to detect game start)
    useEffect(() => {
        const statusRef = ref(db, `games/${roomId}/meta/status`);
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if (status === 'active') {
                onGameStart?.();
            } else if (status === 'cancelled') {
                setRoomCancelled(true);
            }
        });

        return () => unsubscribe();
    }, [roomId, onGameStart]);

    // Listen for messages directed at this device
    useEffect(() => {
        const messageRef = ref(db, `games/${roomId}/messages/${deviceId}`);
        const unsubscribe = onValue(messageRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.type === 'PLAYER_KICKED') {
                    setKicked(true);
                    onKicked?.(data.reason);
                } else if (data.type === 'GAME_STARTED') {
                    onGameStart?.();
                } else if (data.type === 'ROOM_CANCELLED') {
                    setRoomCancelled(true);
                }
            }
        });

        return () => unsubscribe();
    }, [roomId, deviceId, onGameStart, onKicked]);

    const getConnectedCount = () => {
        return Object.values(lobbyPlayers).filter(p => p.connected).length;
    };

    // Kicked state
    if (kicked) {
        return (
            <div className="player-lobby-screen kicked">
                <div className="lobby-message">
                    <span className="message-icon">!</span>
                    <h2>您已被移除</h2>
                    <p>主持人已將您從大廳中移除。</p>
                    <button className="btn-primary" onClick={() => window.location.reload()}>
                        嘗試重新加入
                    </button>
                </div>
            </div>
        );
    }

    // Room cancelled state
    if (roomCancelled) {
        return (
            <div className="player-lobby-screen cancelled">
                <div className="lobby-message">
                    <span className="message-icon">!</span>
                    <h2>房間已取消</h2>
                    <p>主持人已取消此遊戲房間。</p>
                    <button className="btn-primary" onClick={() => window.location.href = '/'}>
                        返回首頁
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="player-lobby-screen">
            <div className="player-lobby-content">
                {/* My Team Info */}
                <div className="my-team-card" style={{ '--team-color': myTeamColor }}>
                    <div className="team-color-bar" style={{ backgroundColor: myTeamColor }}></div>
                    <div className="team-info">
                        <span className="team-label">您的隊伍</span>
                        <span className="team-name">{myTeamName}</span>
                    </div>
                    <span className="connected-badge">已連線</span>
                </div>

                {/* Waiting Message */}
                <div className="waiting-section">
                    <div className="waiting-animation">
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay"></div>
                        <span className="waiting-icon">...</span>
                    </div>
                    <h2>等待主持人開始</h2>
                    <p>主持人按下開始後，遊戲即將開始。</p>
                </div>

                {/* Host Status */}
                <div className={`host-status ${hostOnline ? 'online' : 'offline'}`}>
                    <span className="status-dot"></span>
                    <span>主持人{hostOnline ? '在線' : '離線'}</span>
                </div>

                {/* Other Teams */}
                <div className="other-teams-section">
                    <h3>大廳隊伍 ({getConnectedCount()} / {teamCount})</h3>
                    <div className="teams-list">
                        {teamNames.map((name, index) => {
                            const playerData = lobbyPlayers[index];
                            const isConnected = playerData?.connected;
                            const isMe = index === teamIndex;

                            return (
                                <div
                                    key={index}
                                    className={`team-item ${isConnected ? 'connected' : 'waiting'} ${isMe ? 'me' : ''}`}
                                >
                                    <span
                                        className="team-color-dot"
                                        style={{ backgroundColor: teamColors[index] }}
                                    ></span>
                                    <span className="team-name">{name}</span>
                                    <span className={`team-status ${isConnected ? 'connected' : 'waiting'}`}>
                                        {isMe ? '您' : isConnected ? '已就緒' : '等待中...'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Room Info */}
                <div className="room-info-footer">
                    <span className="room-label">房間代碼:</span>
                    <span className="room-code">{roomId}</span>
                </div>
            </div>
        </div>
    );
};

export default PlayerLobbyScreen;
