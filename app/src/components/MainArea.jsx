import React from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import CardDisplay from './CardDisplay';
import QuestionModal from './QuestionModal';
import AuctionInterface from './AuctionInterface';
import OfferingModal from './OfferingModal';
import Modal from './Modal';
import CountdownTimer from './CountdownTimer';
import './MainArea.css';


const MainArea = () => {
    const { state, dispatch } = useGame();
    const { rollDice, buyLand, skipLand, payRent, endTurn, currentTeam, useMiracle, handleDecision } = useGameEngine();

    return (
        <div className="main-area">
            {/* Center Info - Always visible or visible in background */}
            <div className="center-info">
                <h2>{currentTeam.name} 的回合</h2>

                {state.phase === 'ROLL' && (
                    <button className="dice-btn" onClick={rollDice}>
                        擲骰子 🎲
                    </button>
                )}

                {state.dice && <div className="dice-value">{state.dice}</div>}

                {state.phase === 'BUILD_INN' && (
                    <div className="build-inn-controls">
                        <p>請點擊您的土地以建造旅店</p>
                        <div style={{ margin: '10px 0', fontSize: '1.1rem' }}>
                            <strong>您的現金：</strong> <span style={{ color: '#4ecca3', fontWeight: 'bold' }}>${currentTeam.cash}</span>
                        </div>
                        <button className="btn-primary" onClick={endTurn}>
                            結束回合
                        </button>
                    </div>
                )}
            </div>

            {/* Modals for various phases */}

            {/* Draw Land Modal */}
            {state.phase === 'DRAW_LAND' && !state.currentQuestion && (
                <>
                    {state.actionTimer > 0 && (
                        <CountdownTimer
                            duration={state.actionTimer}
                            onExpire={skipLand}
                        />
                    )}
                    <Modal title="抽到土地卡">
                        <div className="modal-card-display">
                            {state.currentCard && <CardDisplay card={state.currentCard} type="land" />}
                        </div>
                        <div className="player-cash-info" style={{ textAlign: 'center', margin: '10px 0', fontSize: '1.1rem' }}>
                            <strong>您的現金：</strong> <span style={{ color: '#4ecca3', fontWeight: 'bold' }}>${currentTeam.cash}</span>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-success"
                                onClick={buyLand}
                                disabled={!state.currentCard || Number(currentTeam.cash) < Number(state.currentCard.price)}
                                title={state.currentCard && Number(currentTeam.cash) < Number(state.currentCard.price) ? "現金不足" : ""}
                            >
                                購買 ({state.currentCard ? `$${state.currentCard.price}` : '-'})
                            </button>
                            <button className="btn-secondary" onClick={skipLand}>
                                放棄
                            </button>
                        </div>
                        {Number(currentTeam.cash) < Number(state.currentCard.price) && (
                            <div className="error-message">現金不足 (缺 ${Number(state.currentCard.price) - Number(currentTeam.cash)})</div>
                        )}
                    </Modal>
                </>
            )}

            {/* Question Modal (Miracle) */}
            {state.phase === 'DRAW_LAND' && state.currentQuestion && (
                <QuestionModal />
            )}

            {/* Draw Event Modal */}
            {state.phase === 'DRAW_EVENT' && (
                <>
                    {state.actionTimer > 0 && (
                        <CountdownTimer
                            duration={state.actionTimer}
                            onExpire={endTurn}
                        />
                    )}
                    <Modal title="抽到事件卡">
                        <div className="modal-card-display">
                            {state.currentCard && <CardDisplay card={state.currentCard} type="event" />}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={endTurn}>
                                確定
                            </button>
                        </div>
                    </Modal>
                </>
            )}

            {/* Decision Event Modal */}
            {state.phase === 'DECISION_EVENT' && (
                <>
                    {state.actionTimer > 0 && (
                        <CountdownTimer
                            duration={state.actionTimer}
                            onExpire={() => handleDecision('N')}
                        />
                    )}
                    <Modal title="決策事件">
                        <div className="modal-card-display">
                            {state.currentCard && <CardDisplay card={state.currentCard} type="event" />}
                        </div>
                        <div className="decision-effects">
                            <div className="effect-option">
                                <strong>是 (Y):</strong>
                                <span>
                                    {state.currentCard?.yEffect.cash !== 0 && ` 現金${state.currentCard.yEffect.cash > 0 ? '+' : ''}$${state.currentCard.yEffect.cash}`}
                                    {state.currentCard?.yEffect.seeds !== 0 && ` 種子${state.currentCard.yEffect.seeds > 0 ? '+' : ''}${state.currentCard.yEffect.seeds}`}
                                </span>
                            </div>
                            <div className="effect-option">
                                <strong>否 (N):</strong>
                                <span>
                                    {state.currentCard?.nEffect.cash !== 0 && ` 現金${state.currentCard.nEffect.cash > 0 ? '+' : ''}$${state.currentCard.nEffect.cash}`}
                                    {state.currentCard?.nEffect.seeds !== 0 && ` 種子${state.currentCard.nEffect.seeds > 0 ? '+' : ''}${state.currentCard.nEffect.seeds}`}
                                    {state.currentCard?.nEffect.cash === 0 && state.currentCard?.nEffect.seeds === 0 && ' 無效果'}
                                </span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-success" onClick={() => handleDecision('Y')}>
                                是 (Y)
                            </button>
                            <button className="btn-secondary" onClick={() => handleDecision('N')}>
                                否 (N)
                            </button>
                        </div>
                    </Modal>
                </>
            )}

            {/* Auction Modal */}
            {state.phase === 'AUCTION' && (
                <Modal>
                    <AuctionInterface />
                </Modal>
            )}

            {/* Pay Rent Modal */}
            {state.phase === 'PAY_RENT' && state.rentInfo && (
                <Modal title="支付租金">
                    <div className="pay-rent-content">
                        <div className="modal-card-display">
                            {state.currentCard && <CardDisplay card={state.currentCard} type="land" />}
                        </div>
                        <div className="rent-info">
                            <p className="rent-amount">租金: <span>${state.rentInfo.rent}</span></p>
                            <p className="rent-owner">地主: {state.rentInfo.owner.name}</p>
                            <p className="cash-remaining">
                                剩餘現金: ${currentTeam.cash - state.rentInfo.rent}
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={payRent}>
                                支付租金
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Offering Modal (Tithing) */}
            {state.phase === 'OFFERING_EVENT' && (
                <OfferingModal />
            )}
        </div>
    );
};

export default MainArea;
