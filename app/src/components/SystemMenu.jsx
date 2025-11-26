import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../state/GameContext';
import Modal from './Modal';
import './SystemMenu.css';

const SystemMenu = ({ onClose }) => {
    const { state, dispatch, network } = useGame();
    const { teams, gameDuration, gameStartTime, actionTimer } = state;
    const [activeTab, setActiveTab] = useState('connections');

    const handleTimerChange = (newValue) => {
        dispatch({
            type: 'SET_ACTION_TIMER',
            payload: newValue
        });
    };

    const getJoinUrl = (teamIndex) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/join?host=${network.peerId}&team=${teamIndex}`;
    };

    const handleEndGame = () => {
        if (window.confirm('確定要強制結束遊戲嗎？')) {
            dispatch({
                type: 'GAME_OVER',
                payload: {
                    reason: 'admin_forced'
                }
            });
            onClose();
        }
    };

    return (
        <Modal title="系統選單">
            <div className="system-menu">
                <div className="menu-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
                        onClick={() => setActiveTab('connections')}
                    >
                        📱 裝置連接
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ 遊戲設定
                    </button>
                </div>

                <div className="menu-content">
                    {activeTab === 'connections' && (
                        <div className="connections-panel">
                            <div className="qr-grid-mini">
                                {teams.map((team, index) => {
                                    const isConnected = network.connectedTeams[index];
                                    return (
                                        <div key={team.id} className={`qr-card-mini ${isConnected ? 'connected' : ''}`}>
                                            <div className="team-header-mini" style={{ backgroundColor: team.color }}>
                                                {team.name}
                                            </div>
                                            <div className="qr-wrapper-mini">
                                                {isConnected ? (
                                                    <div className="status-connected">
                                                        <span>✅ 已連接</span>
                                                    </div>
                                                ) : (
                                                    <QRCodeSVG
                                                        value={getJoinUrl(index)}
                                                        size={100}
                                                        level="L"
                                                        includeMargin={true}
                                                    />
                                                )}
                                            </div>
                                            {!isConnected && (
                                                <div className="url-mini">{getJoinUrl(index)}</div>
                                            )}
                                            {isConnected && (
                                                <button
                                                    className="btn-disconnect-mini"
                                                    onClick={() => network.disconnectTeam(index)}
                                                >
                                                    斷開
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="settings-panel">
                            <div className="setting-item">
                                <label>遊戲時間限制</label>
                                <div className="value">
                                    {gameDuration === 0 ? '無限制' : `${gameDuration} 分鐘`}
                                </div>
                            </div>
                            <div className="setting-item">
                                <label>開始時間</label>
                                <div className="value">
                                    {gameStartTime ? new Date(gameStartTime).toLocaleTimeString() : '-'}
                                </div>
                            </div>

                            <div className="setting-item editable">
                                <label>行動倒數計時</label>
                                <div className="timer-control">
                                    <button
                                        className="timer-btn"
                                        onClick={() => handleTimerChange(Math.max(0, actionTimer - 1))}
                                        disabled={actionTimer <= 0}
                                    >
                                        -
                                    </button>
                                    <span className="timer-value">
                                        {actionTimer === 0 ? '關閉' : `${actionTimer} 秒`}
                                    </span>
                                    <button
                                        className="timer-btn"
                                        onClick={() => handleTimerChange(actionTimer + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="timer-presets">
                                    <button
                                        className={`preset-btn ${actionTimer === 0 ? 'active' : ''}`}
                                        onClick={() => handleTimerChange(0)}
                                    >
                                        關閉
                                    </button>
                                    <button
                                        className={`preset-btn ${actionTimer === 5 ? 'active' : ''}`}
                                        onClick={() => handleTimerChange(5)}
                                    >
                                        5秒
                                    </button>
                                    <button
                                        className={`preset-btn ${actionTimer === 10 ? 'active' : ''}`}
                                        onClick={() => handleTimerChange(10)}
                                    >
                                        10秒
                                    </button>
                                    <button
                                        className={`preset-btn ${actionTimer === 15 ? 'active' : ''}`}
                                        onClick={() => handleTimerChange(15)}
                                    >
                                        15秒
                                    </button>
                                </div>
                            </div>

                            <div className="admin-actions">
                                <h3>管理員功能</h3>
                                <button className="btn-danger" onClick={handleEndGame}>
                                    ⚠️ 強制結束遊戲
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="menu-footer">
                    <button className="btn-primary" onClick={onClose}>關閉</button>
                </div>
            </div>
        </Modal>
    );
};

export default SystemMenu;
