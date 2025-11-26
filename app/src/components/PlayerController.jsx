import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameProvider, useGame } from '../state/GameContext';
import AnimationOverlay from './AnimationOverlay';
import './PlayerController.css';

import { useGameEngine } from '../hooks/useGameEngine';

const PlayerInterface = ({ teamIndex }) => {
    const { state, dispatch, network, landsData } = useGame();
    const { teams, currentTeamIndex, phase } = state;
    const { rollDice, buyLand, skipLand, payRent, endTurn, useMiracle, handleBid, handlePass, handleDecision, handleOffering, buildInn, answerQuestion } = useGameEngine();
    const [timeLeft, setTimeLeft] = React.useState(null);
    const [showProperties, setShowProperties] = React.useState(false);

    const myTeam = teams[teamIndex];
    const isMyTurn = currentTeamIndex === teamIndex;
    const isAuction = phase === 'AUCTION';
    const isDecision = phase === 'DECISION_EVENT';
    const isOffering = phase === 'OFFERING_EVENT';

    // Calculate owned properties
    const ownedProperties = React.useMemo(() => {
        return landsData.filter(land => state.lands[land.id]?.ownerId === myTeam.id).map(land => ({
            ...land,
            innCount: state.lands[land.id].innCount,
            currentRent: land.rent + (state.lands[land.id].innCount * land.innRent)
        }));
    }, [landsData, state.lands, myTeam.id]);

    const totalPropertyValue = React.useMemo(() => {
        return ownedProperties.reduce((sum, prop) => {
            return sum + prop.price + (prop.innCount * prop.innCost);
        }, 0);
    }, [ownedProperties]);

    // Timer Logic
    React.useEffect(() => {
        if (state.actionTimer > 0 && ['DRAW_LAND', 'DRAW_EVENT', 'DECISION_EVENT', 'OFFERING_EVENT'].includes(phase)) {
            setTimeLeft(state.actionTimer);
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeLeft(null);
        }
    }, [phase, state.actionTimer]);

    if (!myTeam) return <div className="loading">Waiting for game state...</div>;

    // Show Game Over Screen
    if (phase === 'GAME_OVER' && state.winner) {
        const rankings = state.winner.rankings || [];
        const myRanking = rankings.find(r => r.id === myTeam.id);
        const myRank = rankings.findIndex(r => r.id === myTeam.id) + 1;
        const isWinner = myRank === 1;
        const hasSeedBonus = (state.winner.totalSeeds || 0) > 0;

        return (
            <div className="player-controller game-over" style={{ '--team-color': myTeam.color }}>
                <div className="gameover-player-header">
                    <h1 className="gameover-title">
                        {isWinner ? '🏆 恭喜獲勝！ 🏆' : '遊戲結束'}
                    </h1>
                    <div className="rank-display">
                        {isWinner ? (
                            <div className="winner-badge">第 1 名 👑</div>
                        ) : (
                            <div className="rank-badge-large">第 {myRank} 名</div>
                        )}
                    </div>
                </div>

                <div className="my-results-card">
                    <div className="result-row">
                        <span className="result-label">💰 現金</span>
                        <span className="result-value">${myRanking?.cash.toLocaleString() || 0}</span>
                    </div>
                    <div className="result-row">
                        <span className="result-label">🏠 土地價值</span>
                        <span className="result-value">${myRanking?.landValue.toLocaleString() || 0}</span>
                    </div>
                    <div className="result-row highlight">
                        <span className="result-label">💼 基礎資產</span>
                        <span className="result-value">${myRanking?.baseAssets.toLocaleString() || 0}</span>
                    </div>
                    {hasSeedBonus && (
                        <>
                            <div className="result-row">
                                <span className="result-label">🌱 種子</span>
                                <span className="result-value">{myRanking?.seeds || 0} ({((myRanking?.seedMultiplier || 0) * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="result-row bonus">
                                <span className="result-label">✨ 種子獎勵</span>
                                <span className="result-value">+${myRanking?.seedBonus.toLocaleString() || 0}</span>
                            </div>
                        </>
                    )}
                    <div className="result-row final">
                        <span className="result-label">🏆 最終得分</span>
                        <span className="result-value final">${myRanking?.finalScore.toLocaleString() || 0}</span>
                    </div>
                </div>

                <div className="all-rankings-section">
                    <h3>完整排名</h3>
                    {rankings.map((team, index) => (
                        <div
                            key={team.id}
                            className={`ranking-item ${team.id === myTeam.id ? 'my-team' : ''} ${index === 0 ? 'winner' : ''}`}
                            style={{ '--team-color': team.color }}
                        >
                            <div className="ranking-left">
                                <span className="ranking-position">#{index + 1}</span>
                                <span className="ranking-name">{team.name}</span>
                            </div>
                            <span className="ranking-score">${team.finalScore.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <AnimationOverlay />
            </div>
        );
    }

    const handleUseMiracle = (card) => {
        if (isMyTurn && phase === 'ROLL') {
            useMiracle(card);
        }
    };

    const handleRollDice = () => {
        if (navigator.vibrate) navigator.vibrate(200);
        rollDice();
    };

    const renderPhaseControls = () => {
        switch (phase) {
            case 'ROLL':
                return (
                    <button className="btn-action btn-roll" onClick={handleRollDice}>
                        🎲 擲骰子
                    </button>
                );
            case 'DRAW_LAND':
                if (state.currentQuestion) {
                    const q = state.currentQuestion;
                    return (
                        <div className="question-control">
                            <h3 className="question-text">{q.question}</h3>
                            <div className="options-grid">
                                {q.options ? (
                                    q.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            className="btn-option"
                                            onClick={() => answerQuestion(opt === q.answer)}
                                        >
                                            {opt}
                                        </button>
                                    ))
                                ) : (
                                    <div className="phase-msg">請在主螢幕回答問題</div>
                                )}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="decision-controls">
                        <div className="card-preview compact">
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
                        <div className="rent-preview compact">
                            <h3>需支付租金</h3>
                            <p>金額: ${state.rentInfo?.rent}</p>
                        </div>
                        <button className="btn-action btn-danger" onClick={payRent}>
                            支付租金
                        </button>
                    </div>
                );
            case 'DRAW_EVENT':
                const eventCard = state.currentCard;
                if (!eventCard) {
                    return (
                        <div className="phase-msg">
                            <p>抽到事件卡 (查看主螢幕)</p>
                            <button className="btn-action btn-primary" onClick={endTurn}>確定</button>
                        </div>
                    );
                }
                return (
                    <div className="decision-controls">
                        <div className="card-preview compact">
                            <h3>{eventCard.name}</h3>
                            <p className="card-desc-compact">{eventCard.description}</p>
                            {eventCard.type === 'decision' && eventCard.yEffect && (
                                <div className="decision-effects-preview compact">
                                    <div className="effect-row">
                                        <strong>Y:</strong>
                                        <span>
                                            {eventCard.yEffect.cash !== 0 && ` $${eventCard.yEffect.cash}`}
                                            {eventCard.yEffect.seeds !== 0 && ` 🌰${eventCard.yEffect.seeds}`}
                                        </span>
                                    </div>
                                    <div className="effect-row">
                                        <strong>N:</strong>
                                        <span>
                                            {eventCard.nEffect?.cash !== 0 && ` $${eventCard.nEffect?.cash}`}
                                            {eventCard.nEffect?.seeds !== 0 && ` 🌰${eventCard.nEffect?.seeds}`}
                                            {eventCard.nEffect?.cash === 0 && eventCard.nEffect?.seeds === 0 && ' 無效果'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="btn-action btn-primary" onClick={endTurn}>確定</button>
                    </div>
                );
            case 'DECISION_EVENT':
                const card = state.currentCard;
                if (!card) return <div className="phase-msg">等待事件...</div>;
                return (
                    <div className="decision-controls">
                        <div className="card-preview compact">
                            <h3>{card.name}</h3>
                            <p className="card-desc-compact">{card.description}</p>
                        </div>
                        <div className="decision-effects-preview compact">
                            <div className="effect-row">
                                <strong>Y:</strong>
                                <span>
                                    {card.yEffect.cash !== 0 && ` $${card.yEffect.cash}`}
                                    {card.yEffect.seeds !== 0 && ` 🌰${card.yEffect.seeds}`}
                                </span>
                            </div>
                            <div className="effect-row">
                                <strong>N:</strong>
                                <span>
                                    {card.nEffect.cash !== 0 && ` $${card.nEffect.cash}`}
                                    {card.nEffect.seeds !== 0 && ` 🌰${card.nEffect.seeds}`}
                                    {card.nEffect.cash === 0 && card.nEffect.seeds === 0 && ' 無效果'}
                                </span>
                            </div>
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
                const ownedLands = landsData.filter(l => state.lands[l.id].ownerId === myTeam.id);
                if (ownedLands.length === 0) return <div className="phase-msg">沒有可建造旅店的土地</div>;

                return (
                    <div className="build-inn-list">
                        <h3>選擇土地建造旅店</h3>
                        <div className="lands-grid">
                            {ownedLands.map(land => {
                                const landState = state.lands[land.id];
                                const canAfford = myTeam.cash >= land.innCost;
                                return (
                                    <div key={land.id} className="land-item compact">
                                        <div className="land-info">
                                            <span className="land-name">{land.name}</span>
                                            <span className="inn-count">旅店: {landState.innCount}</span>
                                            <span className="inn-cost">費用: ${land.innCost}</span>
                                        </div>
                                        <button
                                            className="btn-build"
                                            disabled={!canAfford}
                                            onClick={() => buildInn(land.id)}
                                        >
                                            建造
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="btn-action btn-secondary mt-2" onClick={endTurn}>
                            結束回合
                        </button>
                    </div>
                );
            case 'OFFERING_EVENT':
                const offering = state.offering;
                if (!offering) return <div className="phase-msg">等待奉獻數據...</div>;
                const { oneTenthAmount, seeds, doubleSeeds } = offering;
                const doubleAmount = oneTenthAmount * 2;
                const canAffordTithe = myTeam.cash >= oneTenthAmount;
                const canAffordDouble = myTeam.cash >= doubleAmount;
                return (
                    <div className="decision-controls">
                        <div className="offering-preview compact">
                            <h3>十分之一奉獻</h3>
                            <p>十分之一: ${oneTenthAmount}</p>
                            <p className="offering-hint">每 $100 = 1 種子</p>
                        </div>
                        <div className="btn-group-vertical">
                            <button className="btn-action btn-secondary" onClick={() => handleOffering('none')}>
                                不奉獻
                            </button>
                            <button
                                className="btn-action btn-success"
                                onClick={() => handleOffering('tithe')}
                                disabled={!canAffordTithe}
                            >
                                十分之一 (-${oneTenthAmount} → +{seeds} 種子)
                            </button>
                            <button
                                className="btn-action btn-gold"
                                onClick={() => handleOffering('double')}
                                disabled={!canAffordDouble}
                            >
                                雙倍奉獻 (-${doubleAmount} → +{doubleSeeds} 種子)
                            </button>
                        </div>
                    </div>
                );
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
                        <div className="auction-info compact">
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
                    <span className="label">💰</span>
                    <span className="value">{myTeam.cash}</span>
                </div>
                <div className="stat-box">
                    <span className="label">🌰</span>
                    <span className="value">{myTeam.seeds}</span>
                </div>
                <div className="stat-box">
                    <span className="label">🎲</span>
                    <span className="value">{myTeam.rollCount || 0}</span>
                </div>
            </div>

            {/* Properties Section */}
            <div className="properties-section">
                <button
                    className="properties-toggle"
                    onClick={() => setShowProperties(!showProperties)}
                >
                    <span className="toggle-text">
                        🏠 我的土地 ({ownedProperties.length})
                    </span>
                    <span className="toggle-icon">{showProperties ? '▼' : '▶'}</span>
                </button>

                {showProperties && (
                    <div className="properties-list">
                        {ownedProperties.length === 0 ? (
                            <p className="empty-text">尚未擁有土地</p>
                        ) : (
                            <>
                                <div className="properties-summary">
                                    <span>總價值: ${totalPropertyValue}</span>
                                </div>
                                {ownedProperties.map((property) => (
                                    <div key={property.id} className="property-item">
                                        <div className="property-header">
                                            <span className="property-name">{property.name}</span>
                                            <span className="property-series">{property.series}</span>
                                        </div>
                                        <div className="property-details">
                                            <div className="detail-row">
                                                <span className="detail-label">價格:</span>
                                                <span className="detail-value">${property.price}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">租金:</span>
                                                <span className="detail-value">${property.currentRent}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">旅店:</span>
                                                <span className="detail-value">
                                                    {property.innCount} / {property.maxInns}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="action-area">
                {isMyTurn || isAuction ? (
                    <div className="active-turn-controls">
                        {isAuction ? <h2>土地拍賣</h2> : (isOffering ? <h2>十分之一奉獻</h2> : (phase === 'DECISION_EVENT' ? <h2>事件選擇</h2> : <h2>輪到你了！</h2>))}
                        {timeLeft !== null && (
                            <div className="action-timer">
                                ⏱️ {timeLeft}s
                            </div>
                        )}
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
            <AnimationOverlay />
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
