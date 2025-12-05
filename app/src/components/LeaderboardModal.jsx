import React, { useMemo } from 'react';
import { useGame } from '../state/GameContext';
import './LeaderboardModal.css';

/**
 * Leaderboard Modal showing current player rankings
 * Calculates based on cash + land values only (seeds are kept secret until game end)
 */
const LeaderboardModal = ({ onClose }) => {
    const { state, landsData } = useGame();

    // Calculate rankings based on cash + land value (excluding seeds)
    const rankings = useMemo(() => {
        return state.teams.map(team => {
            // Get owned lands
            const ownedLandIds = Object.entries(state.lands)
                .filter(([id, landState]) => landState.ownerId === team.id)
                .map(([id]) => id);

            // Calculate land value (land price + inn investments)
            const landValue = ownedLandIds.reduce((sum, landId) => {
                const landData = landsData.find(l => l.id === landId);
                const landState = state.lands[landId];
                if (!landData) return sum;
                return sum + (landData.price || 0) + ((landState?.innCount || 0) * (landData.innCost || 0));
            }, 0);

            const totalAssets = team.cash + landValue;

            return {
                id: team.id,
                name: team.name,
                color: team.color,
                cash: team.cash,
                landCount: ownedLandIds.length,
                landValue,
                totalAssets,
                isBankrupt: team.isBankrupt
            };
        }).sort((a, b) => b.totalAssets - a.totalAssets);
    }, [state.teams, state.lands, landsData]);

    const getRankEmoji = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-modal" onClick={e => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2>🏆 目前排名</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="leaderboard-hint">
                    根據現金 + 土地資產計算 (種子加成將於遊戲結束時揭曉)
                </div>

                <div className="leaderboard-list">
                    {rankings.map((team, index) => (
                        <div
                            key={team.id}
                            className={`leaderboard-item ${index === 0 ? 'leader' : ''} ${team.isBankrupt ? 'bankrupt' : ''}`}
                            style={{ '--team-color': team.color }}
                        >
                            <div className="rank-badge">
                                {getRankEmoji(index)}
                            </div>
                            <div className="team-color-bar" style={{ backgroundColor: team.color }}></div>
                            <div className="team-details">
                                <div className="team-name">{team.name}</div>
                                <div className="team-breakdown">
                                    <span className="stat">💰 ${team.cash.toLocaleString()}</span>
                                    <span className="stat">🏠 {team.landCount} (${ team.landValue.toLocaleString()})</span>
                                </div>
                            </div>
                            <div className="team-total">
                                ${team.totalAssets.toLocaleString()}
                            </div>
                            {team.isBankrupt && <div className="bankrupt-badge">破產</div>}
                        </div>
                    ))}
                </div>

                <div className="leaderboard-footer">
                    <button className="btn-close-leaderboard" onClick={onClose}>
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
