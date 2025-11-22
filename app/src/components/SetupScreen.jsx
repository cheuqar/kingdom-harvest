import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import './SetupScreen.css';

const SetupScreen = () => {
    const { dispatch, state } = useGame();
    const [teamCount, setTeamCount] = useState(2);
    const [names, setNames] = useState(['隊伍 A', '隊伍 B', '隊伍 C', '隊伍 D']);
    const [gameDuration, setGameDuration] = useState(0); // 0 means no limit
    const [savedGame, setSavedGame] = useState(null);
    const [saveTimestamp, setSaveTimestamp] = useState(null);
    const [showResumeModal, setShowResumeModal] = useState(false);

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
                } else {
                    setSavedGame(saveData);
                    setSaveTimestamp(null);
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
                gameDuration: Number(gameDuration)
            }
        });
    };

    const handleResumeClick = () => {
        setShowResumeModal(true);
    };

    const handleConfirmResume = () => {
        if (savedGame) {
            dispatch({ type: 'LOAD_GAME', payload: savedGame });
        }
    };

    const handleDeleteSave = () => {
        localStorage.removeItem('monopoly-game-save');
        setSavedGame(null);
        setSaveTimestamp(null);
        setShowResumeModal(false);
    };

    return (
        <div className="setup-screen">
            {/* Video Background */}
            <video
                className="setup-video-background"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src="/opening.mp4" type="video/mp4" />
            </video>

            {/* Content Overlay */}
            <div className="setup-content">
                <h1>天國大富翁 Kingdom Harvest</h1>
                <div className="setup-form">
                    <label>
                        隊伍數量:
                        <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))}>
                            <option value={2}>2 隊</option>
                            <option value={3}>3 隊</option>
                            <option value={4}>4 隊</option>
                        </select>
                    </label>

                    <label>
                        遊戲時間 (分鐘):
                        <input
                            type="number"
                            min="0"
                            value={gameDuration}
                            onChange={(e) => setGameDuration(e.target.value)}
                            placeholder="0 = 無限制"
                        />
                        <span className="hint">(0 表示無限制)</span>
                    </label>

                    <div className="names-inputs">
                        {Array.from({ length: teamCount }).map((_, i) => (
                            <input
                                key={i}
                                value={names[i]}
                                onChange={(e) => {
                                    const newNames = [...names];
                                    newNames[i] = e.target.value;
                                    setNames(newNames);
                                }}
                                placeholder={`隊伍 ${i + 1} 名稱`}
                            />
                        ))}
                    </div>

                    {savedGame && (
                        <button className="btn-resume" onClick={handleResumeClick}>
                            ▶️ 繼續上次遊戲
                        </button>
                    )}

                    <button className="btn-primary" onClick={handleStart}>下一步：遊戲規則</button>
                </div>
            </div>

            {/* Resume Confirmation Modal */}
            {showResumeModal && savedGame && (
                <div className="modal-overlay" onClick={() => setShowResumeModal(false)}>
                    <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
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
                        </div>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetupScreen;
