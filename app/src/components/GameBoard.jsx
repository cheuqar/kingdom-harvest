
import React, { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext';
import SetupScreen from './SetupScreen';
import ConnectionScreen from './ConnectionScreen';
import RulesScreen from './RulesScreen';
import TeamList from './TeamList';
import MainArea from './MainArea';
import LogPanel from './LogPanel';
import VisualBoard from './VisualBoard';
import AnimationOverlay from './AnimationOverlay';
import SystemMenu from './SystemMenu';
import './GameBoard.css';

const GameBoard = () => {
    const { state, dispatch, landsData } = useGame();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // ... (timer logic)

    if (state.phase === 'SETUP') return <SetupScreen />;
    if (state.phase === 'CONNECT') return <ConnectionScreen />;
    if (state.phase === 'RULES') return <RulesScreen />;

    if (state.phase === 'GAME_OVER') {
        const rankings = state.winner?.rankings || []; // Fallback to empty if function missing
        const reason = state.winner?.reason || 'bankruptcy';

        return (
            <div className="game-over-screen">
                <h1>遊戲結束！</h1>
                {reason === 'time' && <p className="game-over-reason">時間到！</p>}
                {reason === 'admin_forced' && <p className="game-over-reason">管理員強制結束</p>}

                <div className="rankings">
                    <h2>最終排名</h2>
                    {rankings.map((team, index) => (
                        <div
                            key={team.id}
                            className={`ranking-item ${index === 0 ? 'winner' : ''}`}
                            style={{ borderLeftColor: team.color }}
                        >
                            <div className="rank-number">#{index + 1}</div>
                            <div className="team-info">
                                <h3>{team.name}</h3>
                                <div className="team-stats">
                                    <span>💰 現金: ${team.cash}</span>
                                    <span>🏠 土地: {team.landCount}</span>
                                    <span>📊 總資產: ${team.totalAssets}</span>
                                </div>
                            </div>
                            {index === 0 && <div className="winner-badge">👑 冠軍</div>}
                        </div>
                    ))}
                </div>

                <button className="btn-primary" onClick={() => window.location.reload()}>
                    重新開始
                </button>
            </div>
        );
    }

    return (
        <div className="game-board">
            <button className="btn-system-menu" onClick={() => setShowMenu(true)}>
                ⚙️ 選單
            </button>
            {showMenu && <SystemMenu onClose={() => setShowMenu(false)} />}

            {state.gameDuration > 0 && timeRemaining !== null && (
                <div className="timer-display">
                    ⏱️ 剩餘時間: {formatTime ? formatTime(timeRemaining) : timeRemaining}
                </div>
            )}

            <div className="left-panel">
                <TeamList />
            </div>

            <div className="center-panel">
                <VisualBoard>
                    <MainArea />
                </VisualBoard>
            </div>

            <div className="right-panel">
                <LogPanel />
            </div>

            <AnimationOverlay />
        </div>
    );
};

export default GameBoard;
