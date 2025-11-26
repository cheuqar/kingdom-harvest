import React from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import Modal from './Modal';
import CountdownTimer from './CountdownTimer';
import './OfferingModal.css';

const OfferingModal = () => {
    const { state } = useGame();
    const { handleOffering, currentTeam } = useGameEngine();
    const offering = state.offering;

    if (!offering) return null;

    const { totalIncome, oneTenthAmount, seeds, doubleSeeds } = offering;
    const doubleAmount = oneTenthAmount * 2;
    const canAffordTithe = currentTeam.cash >= oneTenthAmount;
    const canAffordDouble = currentTeam.cash >= doubleAmount;

    const handleChoice = (choice) => {
        handleOffering(choice);
    };

    const handleTimeout = () => {
        handleOffering('none');
    };

    return (
        <>
            {state.actionTimer > 0 && (
                <CountdownTimer
                    duration={state.actionTimer + 5}
                    onExpire={handleTimeout}
                />
            )}
            <Modal title="十分之一奉獻">
                <div className="offering-content">
                    <div className="offering-info">
                        <div className="income-display">
                            <span className="label">本輪總收入</span>
                            <span className="value">${totalIncome.toLocaleString()}</span>
                        </div>
                        <div className="tithe-display">
                            <span className="label">十分之一</span>
                            <span className="value">${oneTenthAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <p className="offering-description">
                        你願意奉獻十分之一嗎？每 $100 奉獻可獲得 1 顆種子！
                    </p>

                    <div className="offering-options">
                        <button
                            className="offering-btn btn-skip"
                            onClick={() => handleChoice('none')}
                        >
                            <span className="btn-icon">🚫</span>
                            <span className="btn-label">不奉獻</span>
                            <span className="btn-detail">保留全部收入</span>
                        </button>

                        <button
                            className={`offering-btn btn-tithe ${!canAffordTithe ? 'disabled' : ''}`}
                            onClick={() => canAffordTithe && handleChoice('tithe')}
                            disabled={!canAffordTithe}
                        >
                            <span className="btn-icon">🌱</span>
                            <span className="btn-label">十分之一</span>
                            <span className="btn-detail">
                                -${oneTenthAmount.toLocaleString()} → +{seeds} 種子
                            </span>
                        </button>

                        <button
                            className={`offering-btn btn-double ${!canAffordDouble ? 'disabled' : ''}`}
                            onClick={() => canAffordDouble && handleChoice('double')}
                            disabled={!canAffordDouble}
                        >
                            <span className="btn-icon">🌳</span>
                            <span className="btn-label">雙倍奉獻</span>
                            <span className="btn-detail">
                                -${doubleAmount.toLocaleString()} → +{doubleSeeds} 種子
                            </span>
                        </button>
                    </div>

                    <p className="offering-hint">
                        計時結束將自動選擇「不奉獻」
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default OfferingModal;
