import React, { useEffect } from 'react';
import { useGame } from '../state/GameContext';
import './AnimationOverlay.css';

const AnimationOverlay = ({ myTeamId = null }) => {
    const { state, dispatch } = useGame();
    const { animation } = state;

    useEffect(() => {
        if (animation) {
            const timer = setTimeout(() => {
                dispatch({ type: 'CLEAR_ANIMATION' });
            }, animation.duration || 2000);
            return () => clearTimeout(timer);
        }
    }, [animation, dispatch]);

    if (!animation) return null;

    // If myTeamId is provided (player device), only show animations for this team
    if (myTeamId && animation.targetTeamId && animation.targetTeamId !== myTeamId) {
        return null;
    }

    return (
        <div className="animation-overlay">
            {animation.type === 'MIRACLE' && (
                <div className="miracle-effect">
                    <div className="miracle-flash"></div>
                    <div className="miracle-card-visual">
                        <div className="miracle-content">
                            <span className="miracle-icon">✨</span>
                            <span className="miracle-name">{animation.data.name}</span>
                        </div>
                    </div>
                    <div className="miracle-particles">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="particle" style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`
                            }}></div>
                        ))}
                    </div>
                </div>
            )}

            {animation.type === 'PAY_RENT' && (
                <div className="pay-rent-effect">
                    <div className="money-stream">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flying-money" style={{ animationDelay: `${i * 0.1}s` }}>💸</div>
                        ))}
                    </div>
                    <div className="rent-text">-${animation.data.amount}</div>
                </div>
            )}

            {animation.type === 'ACQUIRE_LAND' && (
                <div className="acquire-land-effect">
                    <div className="flying-card">
                        <div className="card-face">
                            <span className="card-icon">🏠</span>
                            <span className="card-name">{animation.data.name}</span>
                        </div>
                    </div>
                    <div className="acquire-text">獲得土地!</div>
                </div>
            )}

            {animation.type === 'EVENT' && (
                <div className="event-effect">
                    <div className="event-icon">⚡</div>
                    <div className="event-name">{animation.data.name}</div>
                </div>
            )}

            {animation.type === 'BONUS_CASH' && (
                <div className="bonus-cash-effect">
                    <div className="bonus-title">🎉 7次擲骰獎勵! 🎉</div>
                    <div className="bonus-amount">+${animation.data.amount}</div>
                    <div className="bonus-coins">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>💰</span>
                        ))}
                    </div>
                </div>
            )}

            {animation.type === 'CORRECT_ANSWER' && (
                <div className="answer-feedback-effect correct">
                    <div className="answer-icon">✓</div>
                    <div className="answer-text">答對了！</div>
                    <div className="answer-sparkles">
                        {[...Array(12)].map((_, i) => (
                            <span key={i} className="sparkle" style={{
                                left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 40}%`,
                                top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 40}%`,
                                animationDelay: `${i * 0.05}s`
                            }}>✨</span>
                        ))}
                    </div>
                </div>
            )}

            {animation.type === 'WRONG_ANSWER' && (
                <div className="answer-feedback-effect wrong">
                    <div className="answer-icon">✗</div>
                    <div className="answer-text">答錯了</div>
                    <div className="shake-effect"></div>
                </div>
            )}
        </div>
    );
};

export default AnimationOverlay;
