import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../state/GameContext';
import DeviceTakeoverToast from './DeviceTakeoverToast';
import './ConnectionScreen.css';

const ConnectionScreen = () => {
    const { state, dispatch, network } = useGame();
    const { teams } = state;
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

    useEffect(() => {
        // Ensure peer is initialized
        if (!network.peerId) {
            network.initializePeer();
        }
    }, [network]);

    // Auto-advance when current team connects
    useEffect(() => {
        if (network.connectedTeams[currentTeamIndex] && currentTeamIndex < teams.length - 1) {
            // Small delay before auto-advancing for visual feedback
            const timer = setTimeout(() => {
                setCurrentTeamIndex(prev => prev + 1);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [network.connectedTeams, currentTeamIndex, teams.length]);

    const handleStartGame = () => {
        dispatch({ type: 'START_GAME' });
    };

    const handleNext = () => {
        if (currentTeamIndex < teams.length - 1) {
            setCurrentTeamIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentTeamIndex > 0) {
            setCurrentTeamIndex(prev => prev - 1);
        }
    };

    const getJoinUrl = (teamIndex) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join?host=${network.peerId}&team=${teamIndex}`;
    };

    const currentTeam = teams[currentTeamIndex];
    const isCurrentConnected = network.connectedTeams[currentTeamIndex];
    const isLastTeam = currentTeamIndex === teams.length - 1;

    return (
        <div className="connection-screen">
            <h1>連接玩家裝置</h1>

            {/* Team Progress Indicator */}
            <div className="team-progress">
                {teams.map((team, index) => {
                    const isConnected = network.connectedTeams[index];
                    const isCurrent = index === currentTeamIndex;
                    return (
                        <div
                            key={team.id}
                            className={`progress-item ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''}`}
                            onClick={() => setCurrentTeamIndex(index)}
                        >
                            <div
                                className="progress-dot"
                                style={{ backgroundColor: isCurrent ? team.color : undefined }}
                            >
                                {isConnected ? '✓' : index + 1}
                            </div>
                            <span className="progress-name">{team.name}</span>
                        </div>
                    );
                })}
            </div>

            {!network.peerId ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>正在建立連線通道...</span>
                </div>
            ) : (
                <div className="sequential-connection">
                    {/* Current Team Card */}
                    <div className="current-team-card" style={{ borderColor: currentTeam.color }}>
                        <div className="current-team-header" style={{ backgroundColor: currentTeam.color }}>
                            <span className="team-number">第 {currentTeamIndex + 1} 組</span>
                            <span className="team-name-large">{currentTeam.name}</span>
                            {isCurrentConnected && <span className="connected-badge">已連接 ✓</span>}
                        </div>

                        <div className="qr-section">
                            {isCurrentConnected ? (
                                <div className="connected-display">
                                    <div className="connected-icon">✅</div>
                                    <div className="connected-text">裝置已連接</div>
                                    <button
                                        className="btn-disconnect"
                                        onClick={() => network.disconnectTeam(currentTeamIndex)}
                                    >
                                        斷開連接
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="qr-wrapper-large">
                                        <QRCodeSVG
                                            value={getJoinUrl(currentTeamIndex)}
                                            size={280}
                                            level="M"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <p className="scan-instruction">掃描 QR Code 連接裝置</p>
                                    <div className="url-display-full">
                                        <input
                                            type="text"
                                            value={getJoinUrl(currentTeamIndex)}
                                            readOnly
                                            onClick={(e) => e.target.select()}
                                            className="url-input-full"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Controls */}
            <div className="connection-controls">
                <button
                    className="btn-nav btn-prev"
                    onClick={handlePrev}
                    disabled={currentTeamIndex === 0}
                >
                    ← 上一組
                </button>

                {isLastTeam ? (
                    <button className="btn-primary btn-start-game" onClick={handleStartGame}>
                        開始遊戲 🎮
                    </button>
                ) : (
                    <button className="btn-nav btn-next" onClick={handleNext}>
                        {isCurrentConnected ? '下一組 →' : '跳過 →'}
                    </button>
                )}
            </div>

            {/* Connection Summary */}
            <div className="connection-summary">
                {Object.values(network.connectedTeams).filter(Boolean).length} / {teams.length} 裝置已連接
            </div>

            {/* Device Takeover Toast */}
            <DeviceTakeoverToast
                pendingTakeover={network.pendingTakeover}
                teamName={network.pendingTakeover ? teams[network.pendingTakeover.teamIndex]?.name : ''}
                teamColor={network.pendingTakeover ? teams[network.pendingTakeover.teamIndex]?.color : '#fff'}
                onConfirm={() => {
                    network.confirmTakeover();
                    // Broadcast updated state after takeover
                    const { config, ...dynamicState } = state;
                    network.broadcast({ type: 'SYNC_STATE', state: dynamicState });
                }}
                onReject={() => network.rejectTakeover()}
            />
        </div>
    );
};

export default ConnectionScreen;
