import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameProvider, useGame } from '../state/GameContext';
import './PlayerController.css';

import { useGameEngine } from '../hooks/useGameEngine';

const PlayerInterface = ({ teamIndex }) => {
    const { state, dispatch, network } = useGame();
    const { teams, currentTeamIndex, phase } = state;
    const { rollDice, buyLand, skipLand, payRent, endTurn, useMiracle, handleBid, handlePass, handleDecision } = useGameEngine();

    const myTeam = teams[teamIndex];
    const isMyTurn = currentTeamIndex === teamIndex;
    const isAuction = phase === 'AUCTION';
    const isDecision = phase === 'DECISION_EVENT';

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
            case 'DECISION_EVENT':
                const card = state.currentCard;
                if (!card) return <div className="phase-msg">等待事件...</div>;
                return (
                    <div className="decision-controls">
                        <div className="card-preview">
                            <h3>{card.name}</h3>
                            <p>{card.description}</p>
                        </div>
                        <div className="btn-group">
                            <button className="btn-action btn-success" onClick={() => handleDecision('Y')}>
                                是 (Y)
                            </button>
                            <button className="btn-action btn-secondary" onClick={() => handleDecision('N')}>
                                否 (N)
                            </button>
                        </div>
                    </div>
                );
            case 'BUILD_INN':
                return <div className="phase-msg">請在主螢幕選擇土地建造旅店</div>;
            case 'AUCTION':
                if (!state.auction) return <div className="phase-msg">等待拍賣數據...</div>;

                const isActiveBidder = state.auction.activeBidders.includes(myTeam.id);
                const isHighestBidder = state.auction.highestBidderId === myTeam.id;
                const currentBid = state.auction.highestBid;

                if (!isActiveBidder) {
                    return <div className="phase-msg">您已放棄競拍或無資格</div>;
                }

                return (
                    <div className="decision-controls">
                        <div className="auction-info">
                            <h3>當前最高價: ${currentBid}</h3>
                            {isHighestBidder && <p className="status-winning">目前最高出價者！</p>}
                        </div>
                        <div className="btn-group-vertical">
                            <button
                                className="btn-action btn-bid"
                                onClick={() => handleBid(myTeam.id, currentBid + 50)}
                                disabled={myTeam.cash < currentBid + 50}
                            >
                                出價 ${currentBid + 50}
                            </button>
                            <button
                                className="btn-action btn-bid"
                                onClick={() => handleBid(myTeam.id, currentBid + 100)}
                                disabled={myTeam.cash < currentBid + 100}
                            >
                                出價 ${currentBid + 100}
                            </button>
                            <button className="btn-action btn-secondary" onClick={() => handlePass(myTeam.id)}>
                                放棄
                            </button>
                        </div>
                    </div>
                );
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
                {isMyTurn || isAuction ? (
                    <div className="active-turn-controls">
                        {isAuction ? <h2>土地拍賣</h2> : (phase === 'DECISION_EVENT' ? <h2>事件選擇</h2> : <h2>輪到你了！</h2>)}
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
