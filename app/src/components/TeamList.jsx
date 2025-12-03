import React, { useState, useMemo } from 'react';
import { useGame } from '../state/GameContext';
import TeamAssetsModal from './TeamAssetsModal';
import AnimatedNumber from './AnimatedNumber';
import './TeamList.css';

// Helper function to convert hex color to rgba
const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const TeamList = () => {
    const { state, landsData } = useGame();
    const [selectedTeamId, setSelectedTeamId] = useState(null);

    // Sort team indices with current player at top
    const sortedTeamIndices = useMemo(() => {
        const indices = state.teams.map((_, index) => index);

        // Move current team to top
        return indices.sort((a, b) => {
            if (a === state.currentTeamIndex) return -1;
            if (b === state.currentTeamIndex) return 1;
            return a - b;
        });
    }, [state.teams.length, state.currentTeamIndex]);

    return (
        <div className="team-list">
            {sortedTeamIndices.map((teamIndex) => {
                // Get fresh team data from state on each render
                const team = state.teams[teamIndex];
                const isCurrent = teamIndex === state.currentTeamIndex;
                const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === team.id);
                const totalAssets = ownedLands.length + team.miracles.length;
                let stackClass = '';
                if (totalAssets > 0) stackClass = 'stack-1';
                if (totalAssets > 5) stackClass = 'stack-2';
                if (totalAssets > 10) stackClass = 'stack-3';

                // Create a semi-transparent version of the team color for background
                const bgColorRgba = hexToRgba(team.color, 0.15);

                return (
                    <div
                        key={team.id}
                        className={`team-card ${isCurrent ? 'active' : ''} ${team.isBankrupt ? 'bankrupt' : ''} ${stackClass}`}
                        style={{
                            borderLeftColor: team.color,
                            backgroundColor: bgColorRgba,
                            '--team-color': team.color
                        }}
                        onClick={() => setSelectedTeamId(team.id)}
                    >
                        <div className="team-header" style={{
                            background: `linear-gradient(90deg, ${team.color}44 0%, transparent 100%)`
                        }}>
                            <div className="team-name-section">
                                <div className="color-indicator" style={{ backgroundColor: team.color }}></div>
                                <h3>{team.name}</h3>
                            </div>
                            {isCurrent && <span className="turn-badge">當前</span>}
                        </div>

                        {/* Horizontal Icon Boxes */}
                        <div className="team-stats-boxes">
                            <div className="stat-box cash-box">
                                <div className="stat-icon">💰</div>
                                <div className="stat-value">
                                    <AnimatedNumber value={team.cash} prefix="$" />
                                </div>
                            </div>

                            <div className="stat-box seed-box">
                                <div className="stat-icon">🌱</div>
                                <div className="stat-value">
                                    <AnimatedNumber value={team.seeds} />
                                </div>
                            </div>

                            <div className="stat-box miracle-box">
                                <div className="stat-icon">✨</div>
                                <div className="stat-value">
                                    <AnimatedNumber value={team.miracles.length} />
                                </div>
                            </div>

                            <div className="stat-box land-box">
                                <div className="stat-icon">🏠</div>
                                <div className="stat-value">
                                    <AnimatedNumber value={ownedLands.length} />
                                </div>
                            </div>
                        </div>

                        <div className="bonus-progress-container" title="每7次擲骰獲得獎勵">
                            <div
                                className="bonus-progress-bar"
                                style={{ width: `${((team.rollCount || 0) % 7 / 7) * 100}%` }}
                            ></div>
                            <span className="bonus-text">{(team.rollCount || 0) % 7} / 7</span>
                        </div>

                        {team.isBankrupt && <div className="bankrupt-badge">已破產</div>}
                        <div className="view-assets-hint">點擊查看資產</div>
                    </div>
                );
            })}

            {selectedTeamId && (
                <TeamAssetsModal
                    teamId={selectedTeamId}
                    onClose={() => setSelectedTeamId(null)}
                />
            )}
        </div>
    );
};

export default TeamList;
