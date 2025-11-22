
import React, { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext';
import SetupScreen from './SetupScreen';
import RulesScreen from './RulesScreen';
import TeamList from './TeamList';
import MainArea from './MainArea';
import LogPanel from './LogPanel';
import VisualBoard from './VisualBoard';
import AnimationOverlay from './AnimationOverlay';
import './GameBoard.css';

const GameBoard = () => {
    const { state, dispatch, landsData } = useGame();
    const [timeRemaining, setTimeRemaining] = useState(null);

    // Timer logic
    useEffect(() => {
        if (!state.gameStartTime || state.gameDuration === 0 || state.phase === 'GAME_OVER') {
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Date.now() - state.gameStartTime;
            const duration = state.gameDuration * 60 * 1000; // Convert minutes to ms
            const remaining = duration - elapsed;

            if (remaining <= 0) {
                // Time's up! Calculate winner by total assets
                const rankings = calculateRankings();
                dispatch({
                    type: 'GAME_OVER',
                    payload: {
                        winner: rankings[0],
                        rankings,
                        reason: 'time'
                    }
                });
                setTimeRemaining(0);
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [state.gameStartTime, state.gameDuration, state.phase, dispatch]);

    // Calculate total asset value for each team
    const calculateAssetValue = (team) => {
        let total = team.cash;

        // Add land values
        landsData.forEach(land => {
            const landState = state.lands[land.id];
            if (landState.ownerId === team.id) {
                total += land.price;
                // Add inn values
                total += landState.innCount * land.innCost;
            }
        });

        return total;
    };

    // Calculate rankings
    const calculateRankings = () => {
        return state.teams
            .map(team => ({
                ...team,
                totalAssets: calculateAssetValue(team),
                landCount: landsData.filter(l => state.lands[l.id].ownerId === team.id).length
            }))
            .sort((a, b) => b.totalAssets - a.totalAssets);
    };

    // Format time remaining
    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (state.phase === 'SETUP') return <SetupScreen />;
    if (state.phase === 'RULES') return <RulesScreen />;

    if (state.phase === 'GAME_OVER') {
        const rankings = state.winner?.rankings || calculateRankings();
        const reason = state.winner?.reason || 'bankruptcy';

        return (
            <div className="game-over-screen">
                <h1>遊戲結束！</h1>
                {reason === 'time' && <p className="game-over-reason">時間到！</p>}

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
            {state.gameDuration > 0 && timeRemaining !== null && (
                <div className="timer-display">
                    ⏱️ 剩餘時間: {formatTime(timeRemaining)}
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
