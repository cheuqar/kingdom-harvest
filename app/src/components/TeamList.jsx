import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import TeamAssetsModal from './TeamAssetsModal';
import AnimatedNumber from './AnimatedNumber';
import './TeamList.css';

const TeamList = () => {
    const { state, landsData } = useGame();
    const [selectedTeamId, setSelectedTeamId] = useState(null);

    return (
        <div className="team-list">
            {state.teams.map((team, index) => {
                const isCurrent = index === state.currentTeamIndex;
                const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === team.id);
                const totalAssets = ownedLands.length + team.miracles.length;
                let stackClass = '';
                if (totalAssets > 0) stackClass = 'stack-1';
                if (totalAssets > 5) stackClass = 'stack-2';
                if (totalAssets > 10) stackClass = 'stack-3';

                return (
                    <div
                        key={team.id}
                        className={`team-card ${isCurrent ? 'active' : ''} ${team.isBankrupt ? 'bankrupt' : ''} ${stackClass}`}
                        style={{ borderLeftColor: team.color }}
                        onClick={() => setSelectedTeamId(team.id)}
                    >
                        <div className="team-header" style={{
                            background: `linear-gradient(90deg, ${team.color}22 0%, transparent 100%)`
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
