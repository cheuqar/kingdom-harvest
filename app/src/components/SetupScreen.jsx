import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import './SetupScreen.css';

// Import event data
import defaultEvents from '../config/events.json';
import moneyEvents from '../config/events_money.json';

const eventDeckInfo = {
    default: {
        name: '預設事件',
        description: '基本遊戲事件，包含各種日常生活中會遇到的選擇和挑戰。',
        events: defaultEvents
    },
    money: {
        name: '天國金錢管理',
        description: '以聖經教導為基礎的金錢管理事件，幫助玩家學習智慧理財和天國價值觀。',
        events: moneyEvents
    }
};

const SetupScreen = () => {
    const { dispatch, state, network } = useGame();
    const [teamCount, setTeamCount] = useState(2);
    const [names, setNames] = useState(['隊伍 A', '隊伍 B', '隊伍 C', '隊伍 D']);
    const [gameDuration, setGameDuration] = useState(0); // 0 means no limit
    const [savedGame, setSavedGame] = useState(null);
    const [savedPeerId, setSavedPeerId] = useState(null);
    const [saveTimestamp, setSaveTimestamp] = useState(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [selectedDecks, setSelectedDecks] = useState(['default', 'money']);
    const [actionTimer, setActionTimer] = useState(10);
    const [previewDeck, setPreviewDeck] = useState(null);

    // Helper function to format time ago
    const getTimeAgo = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return `${seconds} 秒前`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} 分鐘前`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} 小時前`;
        const days = Math.floor(hours / 24);
        return `${days} 天前`;
    };

    // Check for saved game on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('monopoly-game-save');
            if (saved) {
                const saveData = JSON.parse(saved);
                // Handle both old format (direct state) and new format (with timestamp)
                if (saveData.gameState) {
                    setSavedGame(saveData.gameState);
                    setSaveTimestamp(saveData.timestamp);
                    setSavedPeerId(saveData.peerId || null);
                } else {
                    setSavedGame(saveData);
                    setSaveTimestamp(null);
                    setSavedPeerId(null);
                }
            }
        } catch (error) {
            console.error('Failed to load saved game:', error);
        }
    }, []);

    const handleStart = () => {
        const activeNames = names.slice(0, teamCount);
        dispatch({
            type: 'INIT_GAME',
            payload: {
                teamNames: activeNames,
                gameDuration: Number(gameDuration),
                selectedEventDecks: selectedDecks,
                actionTimer: Number(actionTimer)
            }
        });
    };

    const handleResumeClick = () => {
        setShowResumeModal(true);
    };

    const handleConfirmResume = async () => {
        if (savedGame) {
            setIsRestoring(true);

            // If we have a saved peerId, try to restore the network connection
            if (savedPeerId) {
                console.log('[SetupScreen] Restoring with peerId:', savedPeerId);
                const result = await network.restoreHost(savedPeerId);
                console.log('[SetupScreen] Restore result:', result);
            } else {
                // No saved peerId, initialize a new network connection
                console.log('[SetupScreen] No saved peerId, initializing new connection');
                network.initializePeer();
            }

            // Load the game state
            dispatch({ type: 'LOAD_GAME', payload: savedGame });

            // After loading, the game will transition to CONNECT phase if needed
            // to allow players to reconnect
            setIsRestoring(false);
        }
    };

    const handleDeleteSave = () => {
        localStorage.removeItem('monopoly-game-save');
        network.clearSavedRoom();
        setSavedGame(null);
        setSavedPeerId(null);
        setSaveTimestamp(null);
        setShowResumeModal(false);
    };

    return (
        <div className="setup-screen">
            <div className="setup-left-panel">
                <video
                    className="setup-video-background"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/opening.mp4" type="video/mp4" />
                </video>
            </div>

            <div className="setup-right-panel">
                <div className="setup-content">
                    <div className="game-title">
                        <h1 className="title-cn">天國大富翁</h1>
                        <h2 className="title-en">Kingdom Harvest</h2>
                    </div>

                    <div className="setup-form">
                        {/* Team Count Selection */}
                        <div className="form-section">
                            <div className="section-header">
                                <span className="section-icon">👥</span>
                                <span className="section-title">隊伍設定</span>
                            </div>
                            <label>
                                隊伍數量:
                                <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))}>
                                    <option value={2}>2 隊</option>
                                    <option value={3}>3 隊</option>
                                    <option value={4}>4 隊</option>
                                </select>
                            </label>

                            <div className="names-inputs">
                                {Array.from({ length: teamCount }).map((_, i) => (
                                    <div key={i} className="team-name-input">
                                        <span className="team-number">隊伍 {i + 1}</span>
                                        <input
                                            value={names[i]}
                                            onChange={(e) => {
                                                const newNames = [...names];
                                                newNames[i] = e.target.value;
                                                setNames(newNames);
                                            }}
                                            placeholder={`輸入隊伍 ${i + 1} 名稱`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Game Settings */}
                        <div className="form-section">
                            <div className="section-header">
                                <span className="section-icon">⚙️</span>
                                <span className="section-title">遊戲設定</span>
                            </div>

                            <label>
                                <div className="label-with-icon">
                                    <span className="label-icon">⏱️</span>
                                    <span>遊戲時間 (分鐘)</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={gameDuration}
                                    onChange={(e) => setGameDuration(e.target.value)}
                                    placeholder="0 = 無限制"
                                />
                                <span className="hint">設定 0 表示無時間限制</span>
                            </label>

                            <label>
                                <div className="label-with-icon">
                                    <span className="label-icon">⏲️</span>
                                    <span>行動計時器 (秒)</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={actionTimer}
                                    onChange={(e) => setActionTimer(e.target.value)}
                                    placeholder="5"
                                />
                                <span className="hint">建議 5-10 秒，設定 0 為無計時</span>
                            </label>
                        </div>

                        {/* Event Deck Selection */}
                        <div className="form-section">
                            <div className="section-header">
                                <span className="section-icon">🎴</span>
                                <span className="section-title">事件卡牌庫</span>
                            </div>
                            <div className="deck-options">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedDecks.includes('default')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDecks([...selectedDecks, 'default']);
                                            } else {
                                                setSelectedDecks(selectedDecks.filter(d => d !== 'default'));
                                            }
                                        }}
                                    />
                                    <span className="checkbox-text">
                                        <span className="checkbox-name">預設事件</span>
                                        <span className="checkbox-desc">基本遊戲事件</span>
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-preview-deck"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPreviewDeck('default');
                                        }}
                                    >
                                        ℹ️
                                    </button>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedDecks.includes('money')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDecks([...selectedDecks, 'money']);
                                            } else {
                                                setSelectedDecks(selectedDecks.filter(d => d !== 'money'));
                                            }
                                        }}
                                    />
                                    <span className="checkbox-text">
                                        <span className="checkbox-name">天國金錢管理</span>
                                        <span className="checkbox-desc">聖經金錢教導</span>
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-preview-deck"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPreviewDeck('money');
                                        }}
                                    >
                                        ℹ️
                                    </button>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            {savedGame && (
                                <button className="btn-resume" onClick={handleResumeClick}>
                                    <span className="btn-icon">▶️</span>
                                    繼續上次遊戲
                                </button>
                            )}

                            <button
                                className="btn-primary"
                                onClick={handleStart}
                                disabled={selectedDecks.length === 0}
                            >
                                <span className="btn-icon">🎮</span>
                                開始遊戲
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resume Confirmation Modal */}
            {showResumeModal && savedGame && (
                <div className="modal-overlay" onClick={() => !isRestoring && setShowResumeModal(false)}>
                    <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
                        {isRestoring ? (
                            <div className="restoring-state">
                                <div className="loading-spinner"></div>
                                <h3>正在恢復遊戲...</h3>
                                <p>正在重新建立連線</p>
                            </div>
                        ) : (
                            <>
                                <h3>繼續遊戲</h3>
                                {saveTimestamp && (
                                    <p className="modal-save-time">最後儲存：{getTimeAgo(saveTimestamp)}</p>
                                )}
                                <div className="modal-game-summary">
                                    <div className="modal-summary-item">
                                        <span>隊伍數量:</span>
                                        <strong>{savedGame.teams?.length || 0} 隊</strong>
                                    </div>
                                    <div className="modal-summary-item">
                                        <span>當前玩家:</span>
                                        <strong>{savedGame.teams?.[savedGame.currentTeamIndex]?.name || '-'}</strong>
                                    </div>
                                    <div className="modal-summary-item">
                                        <span>遊戲階段:</span>
                                        <strong>{savedGame.phase || '-'}</strong>
                                    </div>
                                    {savedPeerId && (
                                        <div className="modal-summary-item">
                                            <span>房間代碼:</span>
                                            <strong className="room-code">{savedPeerId}</strong>
                                        </div>
                                    )}
                                </div>
                                {savedPeerId && (
                                    <p className="modal-reconnect-info">
                                        玩家裝置將自動重新連接
                                    </p>
                                )}
                                <p className="modal-question">確定要繼續這場遊戲嗎？</p>
                                <div className="modal-buttons">
                                    <button className="btn-success" onClick={handleConfirmResume}>
                                        確定繼續
                                    </button>
                                    <button className="btn-danger" onClick={handleDeleteSave}>
                                        刪除存檔
                                    </button>
                                    <button className="btn-secondary" onClick={() => setShowResumeModal(false)}>
                                        取消
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Event Deck Preview Modal */}
            {previewDeck && eventDeckInfo[previewDeck] && (
                <div className="modal-overlay" onClick={() => setPreviewDeck(null)}>
                    <div className="deck-preview-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-modal" onClick={() => setPreviewDeck(null)}>✕</button>

                        <h2 className="preview-title">
                            <span className="preview-icon">🎴</span>
                            {eventDeckInfo[previewDeck].name}
                        </h2>

                        <p className="preview-description">
                            {eventDeckInfo[previewDeck].description}
                        </p>

                        <div className="preview-events-section">
                            <h3>事件列表 ({eventDeckInfo[previewDeck].events.length} 張)</h3>
                            <div className="preview-events-list">
                                {eventDeckInfo[previewDeck].events.map((event, index) => (
                                    <div key={index} className="preview-event-card">
                                        <div className="preview-event-header">
                                            <span className="preview-event-name">{event.name}</span>
                                            <span className={`preview-event-type ${event.type}`}>
                                                {event.type === 'decision' ? '🤔 選擇' : '💰 金錢'}
                                            </span>
                                        </div>
                                        <p className="preview-event-desc">{event.description}</p>
                                        {event.type === 'decision' && event.yEffect && (
                                            <div className="preview-effects">
                                                <div className="preview-effect">
                                                    <span className="effect-label">✅ 是:</span>
                                                    <span className="effect-value">
                                                        {event.yEffect.cash !== 0 && ` $${event.yEffect.cash > 0 ? '+' + event.yEffect.cash : event.yEffect.cash}`}
                                                        {event.yEffect.seeds !== 0 && ` 🌰${event.yEffect.seeds > 0 ? '+' + event.yEffect.seeds : event.yEffect.seeds}`}
                                                    </span>
                                                </div>
                                                <div className="preview-effect">
                                                    <span className="effect-label">❌ 否:</span>
                                                    <span className="effect-value">
                                                        {event.nEffect?.cash !== 0 && ` $${event.nEffect.cash > 0 ? '+' + event.nEffect.cash : event.nEffect.cash}`}
                                                        {event.nEffect?.seeds !== 0 && ` 🌰${event.nEffect.seeds > 0 ? '+' + event.nEffect.seeds : event.nEffect.seeds}`}
                                                        {event.nEffect?.cash === 0 && event.nEffect?.seeds === 0 && ' 無效果'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetupScreen;
