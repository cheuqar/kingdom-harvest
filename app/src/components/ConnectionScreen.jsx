import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../state/GameContext';
import './ConnectionScreen.css';

const ConnectionScreen = () => {
    const { state, dispatch, network } = useGame();
    const { teams } = state;

    useEffect(() => {
        // Ensure peer is initialized
        if (!network.peerId) {
            network.initializePeer();
        }
    }, [network]);

    const handleStartGame = () => {
        dispatch({ type: 'SET_PHASE', payload: 'RULES' });
    };

    const getJoinUrl = (teamIndex) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join?host=${network.peerId}&team=${teamIndex}`;
    };

    return (
        <div className="connection-screen">
            <h1>連接玩家裝置</h1>
            <p className="instruction">請掃描對應隊伍的 QR Code 進行連接</p>

            {!network.peerId ? (
                <div className="loading">正在建立連線通道...</div>
            ) : (
                <div className="qr-grid">
                    {teams.map((team, index) => {
                        const isConnected = network.connectedTeams[index];
                        return (
                            <div key={team.id} className={`qr-card ${isConnected ? 'connected' : ''}`}>
                                <div className="team-header" style={{ backgroundColor: team.color }}>
                                    {team.name}
                                </div>
                                <div className="qr-wrapper">
                                    {isConnected ? (
                                        <div className="connected-status">
                                            <span className="icon">📱</span>
                                            <span>已連接</span>
                                        </div>
                                    ) : (
                                        <QRCodeSVG
                                            value={getJoinUrl(index)}
                                            size={150}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                </div>
                                {!isConnected && (
                                    <div className="url-display">
                                        <p>或訪問:</p>
                                        <div className="url-box">{getJoinUrl(index)}</div>
                                    </div>
                                )}
                                {isConnected && (
                                    <button
                                        className="btn-disconnect"
                                        onClick={() => network.disconnectTeam(index)}
                                    >
                                        斷開連接
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="controls">
                <button className="btn-primary" onClick={handleStartGame}>
                    開始遊戲 (前往規則)
                </button>
            </div>
        </div>
    );
};

export default ConnectionScreen;
