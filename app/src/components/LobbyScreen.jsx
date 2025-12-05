import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../config/firebase';
import { ref, onValue, set, remove, get, serverTimestamp } from 'firebase/database';
import { GameProvider } from '../state/GameContext';
import GameBoard from './GameBoard';
import './LobbyScreen.css';

const TEAM_COLORS = ['#e94560', '#4ecca3', '#3282b8', '#f1c40f'];

const LobbyScreen = ({ roomId, isHost, roomData }) => {
    const [lobbyPlayers, setLobbyPlayers] = useState({});
    const [config, setConfig] = useState(roomData?.config || {});
    const [currentTeamView, setCurrentTeamView] = useState(0);
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const teamCount = config.teamNames?.length || roomData?.meta?.teamCount || 2;
    const teamNames = config.teamNames || Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`);
    const teamColors = config.teamColors || TEAM_COLORS.slice(0, teamCount);

    // Listen for lobby updates
    useEffect(() => {
        const lobbyRef = ref(db, `games/${roomId}/lobby`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            const data = snapshot.val() || {};
            setLobbyPlayers(data);
        });

        return () => unsubscribe();
    }, [roomId]);

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

    // Listen for game start (status change)
    useEffect(() => {
        const statusRef = ref(db, `games/${roomId}/meta/status`);
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const status = snapshot.val();
            if (status === 'active') {
                setGameStarted(true);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Set host presence
    useEffect(() => {
        if (isHost) {
            const hostRef = ref(db, `games/${roomId}/host`);
            set(hostRef, { online: true, timestamp: serverTimestamp() });
        }
    }, [roomId, isHost]);

    const getPlayerUrl = (teamIndex) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join?host=${roomId}&team=${teamIndex}`;
    };

    const handleCopyUrl = async (url, type) => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedUrl(type);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const getConnectedCount = () => {
        return Object.values(lobbyPlayers).filter(p => p.connected).length;
    };

    const handleKickPlayer = async (teamIndex) => {
        if (!isHost) return;

        const playerData = lobbyPlayers[teamIndex];
        if (!playerData) return;

        // Remove from lobby
        await remove(ref(db, `games/${roomId}/lobby/${teamIndex}`));

        // Send kicked message to player's device
        if (playerData.deviceId) {
            await set(ref(db, `games/${roomId}/messages/${playerData.deviceId}`), {
                type: 'PLAYER_KICKED',
                reason: 'Removed by host',
                timestamp: serverTimestamp()
            });
        }
    };

    const handleCancelRoom = async () => {
        if (!isHost) return;

        try {
            // Set status to cancelled
            await set(ref(db, `games/${roomId}/meta/status`), 'cancelled');

            // Notify all connected players
            Object.entries(lobbyPlayers).forEach(async ([_, playerData]) => {
                if (playerData.deviceId) {
                    await set(ref(db, `games/${roomId}/messages/${playerData.deviceId}`), {
                        type: 'ROOM_CANCELLED',
                        timestamp: serverTimestamp()
                    });
                }
            });

            // Delete the room
            await remove(ref(db, `games/${roomId}`));

            // Redirect to home
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to cancel room:', error);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) return;
        setIsStarting(true);

        try {
            // Get current config
            const configSnap = await get(ref(db, `games/${roomId}/config`));
            const currentConfig = configSnap.val() || {};

            // Move lobby connections to teams
            const lobbySnap = await get(ref(db, `games/${roomId}/lobby`));
            const lobbyData = lobbySnap.val() || {};

            // Register each connected player as a team controller
            for (const [teamIndex, playerData] of Object.entries(lobbyData)) {
                if (playerData.connected && playerData.deviceId) {
                    await set(ref(db, `games/${roomId}/teams/${teamIndex}`), {
                        deviceId: playerData.deviceId,
                        online: true
                    });
                }
            }

            // Update room status to active
            await set(ref(db, `games/${roomId}/meta/status`), 'active');

            // Broadcast game started message
            for (const [_, playerData] of Object.entries(lobbyData)) {
                if (playerData.deviceId) {
                    await set(ref(db, `games/${roomId}/messages/${playerData.deviceId}`), {
                        type: 'GAME_STARTED',
                        timestamp: serverTimestamp()
                    });
                }
            }

            // The game started state change will trigger the transition
            setGameStarted(true);
        } catch (error) {
            console.error('Failed to start game:', error);
            setIsStarting(false);
        }
    };

    const formatExpiry = (timestamp) => {
        if (!timestamp) return '';
        const diffMs = timestamp - Date.now();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `剩餘 ${diffDays} 天 ${diffHours % 24} 小時`;
        }
        if (diffHours > 0) {
            return `剩餘 ${diffHours} 小時`;
        }
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `剩餘 ${diffMins} 分鐘`;
    };

    // If game started, show GameBoard
    if (gameStarted) {
        return (
            <GameProvider restoreFromRoom={roomId}>
                <div className="app-container">
                    <GameBoard />
                </div>
            </GameProvider>
        );
    }

    return (
        <div className="lobby-screen">
            <div className="lobby-content">
                {/* Header */}
                <div className="lobby-header">
                    <div className="room-info">
                        <span className="room-label">房間代碼</span>
                        <span className="room-code">{roomId}</span>
                    </div>
                    {roomData?.meta?.expiresAt && (
                        <span className="room-expiry">{formatExpiry(roomData.meta.expiresAt)}</span>
                    )}
                </div>

                {/* Team Status Grid */}
                <div className="teams-grid">
                    {teamNames.map((name, index) => {
                        const playerData = lobbyPlayers[index];
                        const isConnected = playerData?.connected;

                        return (
                            <div
                                key={index}
                                className={`team-card ${isConnected ? 'connected' : 'waiting'}`}
                                style={{ '--team-color': teamColors[index] }}
                            >
                                <div className="team-card-header">
                                    <span className="team-color-indicator" style={{ backgroundColor: teamColors[index] }}></span>
                                    <span className="team-name">{name}</span>
                                    <span className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
                                        {isConnected ? '已連線' : '等待中...'}
                                    </span>
                                </div>

                                {isConnected ? (
                                    <div className="team-connected-info">
                                        <span className="device-id">{playerData.deviceId?.slice(0, 8)}...</span>
                                        {isHost && (
                                            <button
                                                className="btn-kick"
                                                onClick={() => handleKickPlayer(index)}
                                            >
                                                踢出
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="team-qr-small" onClick={() => setCurrentTeamView(index)}>
                                        <QRCodeSVG
                                            value={getPlayerUrl(index)}
                                            size={80}
                                            level="M"
                                            includeMargin={true}
                                        />
                                        <span className="tap-hint">點擊放大</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* QR Code Enlarged View */}
                <div className="qr-enlarged-section">
                    <div className="section-header">
                        <span className="section-title">玩家加入連結</span>
                    </div>

                    <div className="team-selector">
                        {teamNames.map((name, index) => (
                            <button
                                key={index}
                                className={`team-tab ${currentTeamView === index ? 'active' : ''}`}
                                style={{
                                    '--team-color': teamColors[index],
                                    borderColor: currentTeamView === index ? teamColors[index] : 'transparent'
                                }}
                                onClick={() => setCurrentTeamView(index)}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    <div className="qr-display" style={{ '--team-color': teamColors[currentTeamView] }}>
                        <div className="qr-wrapper">
                            <QRCodeSVG
                                value={getPlayerUrl(currentTeamView)}
                                size={180}
                                level="M"
                                includeMargin={true}
                            />
                        </div>
                        <button
                            className={`btn-copy ${copiedUrl === `team-${currentTeamView}` ? 'copied' : ''}`}
                            onClick={() => handleCopyUrl(getPlayerUrl(currentTeamView), `team-${currentTeamView}`)}
                        >
                            {copiedUrl === `team-${currentTeamView}` ? '已複製!' : '複製連結'}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="lobby-actions">
                    <div className="connection-summary">
                        <span className="connected-count">{getConnectedCount()}</span>
                        <span className="total-count">/ {teamCount} 隊已連線</span>
                    </div>

                    <button
                        className="btn-start"
                        onClick={handleStartGame}
                        disabled={isStarting || getConnectedCount() === 0}
                    >
                        {isStarting ? (
                            <>
                                <span className="loading-spinner-small"></span>
                                啟動中...
                            </>
                        ) : (
                            <>開始遊戲</>
                        )}
                    </button>

                    <button
                        className="btn-cancel"
                        onClick={() => setShowCancelConfirm(true)}
                    >
                        取消房間
                    </button>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3>取消房間？</h3>
                        <p>這將會中斷所有玩家連線並刪除房間。此操作無法復原。</p>
                        <div className="modal-buttons">
                            <button className="btn-danger" onClick={handleCancelRoom}>
                                是，取消房間
                            </button>
                            <button className="btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                                否，保留房間
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LobbyScreen;
