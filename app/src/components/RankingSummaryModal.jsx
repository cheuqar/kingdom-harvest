import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../state/GameContext';
import './RankingSummaryModal.css';

const RankingSummaryModal = () => {
    const { state, dispatch, landsData } = useGame();
    const [timeLeft, setTimeLeft] = useState(15);

    // Calculate rankings
    const rankings = useMemo(() => {
        return state.teams
            .filter(t => !t.isBankrupt)
            .map(team => {
                const ownedLands = Object.entries(state.lands)
                    .filter(([id, land]) => land.ownerId === team.id);
                const landValue = ownedLands.reduce((sum, [id, land]) => {
                    const landData = landsData.find(l => l.id === id);
                    return sum + (landData?.price || 0) + (land.innCount * (landData?.innCost || 0));
                }, 0);
                return {
                    ...team,
                    landValue,
                    landCount: ownedLands.length,
                    totalAssets: team.cash + landValue
                };
            })
            .sort((a, b) => b.totalAssets - a.totalAssets);
    }, [state.teams, state.lands, landsData]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    dispatch({ type: 'DISMISS_RANKING_SUMMARY' });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [dispatch]);

    const handleSkip = () => {
        dispatch({ type: 'DISMISS_RANKING_SUMMARY' });
    };

    return (
        <div className="ranking-summary-overlay">
            <div className="ranking-summary-modal">
                <div className="summary-header">
                    <h2>第 {state.rankingSummary?.round} 輪排名</h2>
                    <div className="countdown-timer">{timeLeft}s</div>
                </div>

                <div className="rankings-list">
                    {rankings.map((team, index) => (
                        <div key={team.id} className={`ranking-row rank-${index + 1}`}>
                            <span className="rank">#{index + 1}</span>
                            <span className="team-name" style={{ color: team.color }}>
                                {team.name}
                            </span>
                            <div className="assets-breakdown">
                                <span className="cash">💰 ${team.cash.toLocaleString()}</span>
                                <span className="land">🏠 ${team.landValue.toLocaleString()}</span>
                                <span className="total">= ${team.totalAssets.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="btn-skip" onClick={handleSkip}>
                    繼續遊戲 →
                </button>
            </div>
        </div>
    );
};

export default RankingSummaryModal;
