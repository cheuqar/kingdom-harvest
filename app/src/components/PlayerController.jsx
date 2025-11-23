import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameProvider, useGame } from '../state/GameContext';
import './PlayerController.css';

import { useGameEngine } from '../hooks/useGameEngine';

const PlayerInterface = ({ teamIndex }) => {
    const { state, dispatch, network } = useGame();
    const { teams, currentTeamIndex, phase } = state;
    const { rollDice, buyLand, skipLand, payRent, endTurn, useMiracle } = useGameEngine();

    const myTeam = teams[teamIndex];
    const isMyTurn = currentTeamIndex === teamIndex;

    if (!myTeam) return <div className="loading">Waiting for game state...</div>;

    const handleUseMiracle = (card) => {
        if (isMyTurn && phase === 'ROLL') {
            useMiracle(card);
        }
    };

    const renderPhaseControls = () => {
        switch (phase) {
            case 'ROLL':
                return (
                    <button className="btn-action btn-roll" onClick={rollDice}>
                        🎲 擲骰子
                    </button>
                );
            case 'DRAW_LAND':
                if (state.currentQuestion) return <div className="phase-msg">請回答問題 (查看主螢幕)</div>;
                return (
                    <div className="decision-controls">
                        <div className="card-preview">
                            <h3>{state.currentCard?.name}</h3>
                            <p>價格: ${state.currentCard?.price}</p>
                        </div>
                        <div className="btn-group">
                            <button
                                className="btn-action btn-success"
                                onClick={buyLand}
                                disabled={myTeam.cash < state.currentCard?.price}
                            >
                                購買
                            </button>
                            <button className="btn-action btn-secondary" onClick={skipLand}>
                                放棄 / 拍賣
                            </button>
                        </div>
                    </div>
                );
            case 'PAY_RENT':
                return (
                    <div className="decision-controls">
                        <div className="rent-preview">
                            <h3>需支付租金</h3>
                            <p>金額: ${state.rentInfo?.rent}</p>
                        </div>
                        <button className="btn-action btn-danger" onClick={payRent}>
                            支付租金
                        </button>
                    </div>
                );
            case 'DRAW_EVENT':
                return (
                    <div className="phase-msg">
                        <p>抽到事件卡 (查看主螢幕)</p>
                        <button className="btn-action btn-primary" onClick={endTurn}>確定</button>
                    </div>
                );
            case 'BUILD_INN':
                return <div className="phase-msg">請在主螢幕選擇土地建造旅店</div>;
            case 'AUCTION':
                return <div className="phase-msg">拍賣進行中 (請在主螢幕出價)</div>;
            default:
                return <div className="phase-msg">等待中... ({phase})</div>;
        }
    };

    return (
        <div className="player-controller" style={{ '--team-color': myTeam.color }}>
            <div className="player-header">
                <div className="team-badge">{myTeam.name}</div>
                <div className="connection-status">
                    {network.hostConnection?.open ? '🟢 Online' : '🔴 Offline'}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-box">
                    <span className="label">現金</span>
                    <span className="value">${myTeam.cash}</span>
                </div>
                <div className="stat-box">
                    <span className="label">種子</span>
                    <span className="value">{myTeam.seeds}</span>
                </div>
            </div>

            <div className="action-area">
                {isMyTurn ? (
                    <div className="active-turn-controls">
                        <h2>輪到你了！</h2>
                        {renderPhaseControls()}
                    </div>
                ) : (
                    <div className="waiting-turn">
                        <p>等待 {teams[currentTeamIndex].name} 行動...</p>
                        <p className="phase-hint">當前階段: {phase}</p>
                    </div>
                )}
            </div>

            <div className="cards-section">
                <h3>我的神蹟卡</h3>
                <div className="cards-list">
                    {(!myTeam.miracles || myTeam.miracles.length === 0) && <p className="empty-text">無神蹟卡</p>}
                    {(myTeam.miracles || []).map((card, i) => (
                        <div key={i} className="card-item">
                            <div className="card-info">
                                <span className="card-name">{card.name}</span>
                                <span className="card-desc">{card.description}</span>
                            </div>
                            {isMyTurn && phase === 'ROLL' && (
                                <button
                                    className="btn-use-card"
                                    onClick={() => handleUseMiracle(card)}
                                >
                                    使用
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlayerController = () => {
    const [searchParams] = useSearchParams();
    const hostId = searchParams.get('host');
    const teamIndex = parseInt(searchParams.get('team'), 10);

    const networkParams = useMemo(() => ({ hostId, teamIndex }), [hostId, teamIndex]);

    if (!hostId || isNaN(teamIndex)) {
        return (
            <div className="error-screen">
                <h1>無效的連接連結</h1>
                <p>請重新掃描 QR Code</p>
            </div>
        );
    }

    return (
        <GameProvider isClientMode={true} networkParams={networkParams}>
            <PlayerInterface teamIndex={teamIndex} />
        </GameProvider>
    );
};

export default PlayerController;
