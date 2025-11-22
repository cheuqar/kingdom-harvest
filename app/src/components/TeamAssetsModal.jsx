import React from 'react';
import ReactDOM from 'react-dom';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { calculateRent } from '../utils/gameUtils';
import './TeamAssetsModal.css';

const TeamAssetsModal = ({ teamId, onClose }) => {
    const { state, landsData } = useGame();
    const { sellLand } = useGameEngine();
    const team = state.teams.find(t => t.id === teamId);

    if (!team) return null;

    const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === team.id);
    const isCurrentTeam = state.teams[state.currentTeamIndex]?.id === teamId;
    const canSell = team.cash < 0 && isCurrentTeam;

    // Group by series
    const landsBySeries = ownedLands.reduce((acc, land) => {
        if (!acc[land.series]) acc[land.series] = [];
        acc[land.series].push(land);
        return acc;
    }, {});

    const calculateSellPrice = (land, innCount) => {
        return Math.floor(land.price / 2) + Math.floor((innCount * land.innCost) / 2);
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="assets-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{team.name} 的資產</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {canSell && (
                    <div className="bankruptcy-warning">
                        ⚠️ 現金不足！您可以半價出售土地以償還債務
                    </div>
                )}

                <div className="assets-content">
                    <div className="section">
                        <h3>基本資訊</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <label>現金</label>
                                <span className={team.cash < 0 ? 'negative' : ''}>${team.cash}</span>
                            </div>
                            <div className="stat-item">
                                <label>種子</label>
                                <span>{team.seeds}</span>
                            </div>
                            <div className="stat-item">
                                <label>神蹟卡</label>
                                <span>{team.miracles.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3>土地資產 ({ownedLands.length})</h3>
                        {ownedLands.length === 0 ? (
                            <p className="empty-text">尚未擁有土地</p>
                        ) : (
                            <div className="series-list">
                                {Object.entries(landsBySeries).map(([series, lands]) => (
                                    <div key={series} className="series-group">
                                        <h4 className="series-title">{series}</h4>
                                        <div className="lands-list">
                                            {lands.map(land => {
                                                const landState = state.lands[land.id];
                                                const currentRent = calculateRent(land, landState, team.id, landsData, state.lands);
                                                const sellPrice = calculateSellPrice(land, landState.innCount);

                                                return (
                                                    <div key={land.id} className="land-row">
                                                        <div className="land-info">
                                                            <span className="land-name">{land.name}</span>
                                                            <div className="land-details">
                                                                <span className="badge inn">旅店: {landState.innCount}</span>
                                                                <span className="badge rent">租金: ${currentRent}</span>
                                                                {canSell && (
                                                                    <span className="badge sell-price">售價: ${sellPrice}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {canSell && (
                                                            <button
                                                                className="btn-sell"
                                                                onClick={() => sellLand(land.id)}
                                                            >
                                                                出售
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {team.miracles.length > 0 && (
                        <div className="section">
                            <h3>神蹟卡庫存</h3>
                            <div className="cards-list">
                                {team.miracles.map((card, i) => (
                                    <div key={i} className="card-item">
                                        {card.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TeamAssetsModal;
