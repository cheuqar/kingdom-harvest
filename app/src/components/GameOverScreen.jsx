import React, { useState, useEffect } from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({ winner }) => {
    const [step, setStep] = useState(0); // 0: base, 1: seed reveal, 2: final
    const [animatingIndex, setAnimatingIndex] = useState(-1);

    const rankings = winner?.rankings || [];
    const reason = winner?.reason || 'bankruptcy';
    const totalSeeds = winner?.totalSeeds || 0;

    useEffect(() => {
        // Step 0: Show base assets
        const timer1 = setTimeout(() => setStep(1), 2000);

        // Step 1: Animate seed multiplier for each team
        const timer2 = setTimeout(() => {
            rankings.forEach((_, index) => {
                setTimeout(() => {
                    setAnimatingIndex(index);
                }, index * 1500);
            });
        }, 2500);

        // Step 2: Show final rankings
        const timer3 = setTimeout(() => {
            setStep(2);
            setAnimatingIndex(-1);
        }, 2500 + (rankings.length * 1500) + 1000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [rankings.length]);

    return (
        <div className="game-over-screen">
            <div className="game-over-header">
                <h1 className="glowing-title">遊戲結束！</h1>
                {reason === 'time' && <p className="game-over-reason">⏰ 時間到！</p>}
                {reason === 'admin_forced' && <p className="game-over-reason">⚠️ 管理員強制結束</p>}
                {reason === 'bankruptcy' && <p className="game-over-reason">💰 破產決勝</p>}
            </div>

            {totalSeeds > 0 && step >= 1 && (
                <div className="seed-announcement">
                    <h2 className="pulse-text">🌱 種子加成計算中...</h2>
                    <p>「種子」數量決定你的資產倍率！</p>
                </div>
            )}

            <div className="rankings">
                {step === 2 && <h2 className="final-rankings-title">🏆 最終排名 🏆</h2>}

                {rankings.map((team, index) => {
                    const isAnimating = animatingIndex === index;
                    const showMultiplier = step >= 1 && (isAnimating || step === 2);
                    const isWinner = step === 2 && index === 0;

                    return (
                        <div
                            key={team.id}
                            className={`ranking-item ${isWinner ? 'winner' : ''} ${isAnimating ? 'animating' : ''}`}
                            style={{
                                borderLeftColor: team.color,
                                animationDelay: `${index * 0.2}s`
                            }}
                        >
                            {step === 2 && (
                                <div className="rank-number">
                                    {index === 0 ? '👑' : `#${index + 1}`}
                                </div>
                            )}

                            <div className="team-info">
                                <h3>{team.name}</h3>

                                <div className="team-stats">
                                    <div className="stat-row">
                                        <span className="stat-label">💰 現金:</span>
                                        <span className="stat-value">${team.cash.toLocaleString()}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">🏠 土地價值:</span>
                                        <span className="stat-value">${team.landValue.toLocaleString()}</span>
                                    </div>
                                    <div className="stat-row base-total">
                                        <span className="stat-label">💼 基礎資產:</span>
                                        <span className="stat-value">${team.baseAssets.toLocaleString()}</span>
                                    </div>

                                    {totalSeeds > 0 && (
                                        <>
                                            <div className={`stat-row seed-multiplier ${showMultiplier ? 'show' : ''}`}>
                                                <span className="stat-label">🌱 種子:</span>
                                                <span className="stat-value">
                                                    {team.seeds || 0} / {totalSeeds}
                                                    {showMultiplier && (
                                                        <span className="multiplier-text">
                                                            ({(team.seedMultiplier * 100).toFixed(1)}% 加成)
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {showMultiplier && (
                                                <div className="stat-row seed-bonus show">
                                                    <span className="stat-label">✨ 種子獎勵:</span>
                                                    <span className="stat-value bonus">
                                                        +${team.seedBonus.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {(showMultiplier || totalSeeds === 0) && (
                                        <div className={`stat-row final-score ${showMultiplier ? 'show' : ''}`}>
                                            <span className="stat-label">🏆 最終得分:</span>
                                            <span className="stat-value final">${team.finalScore.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isWinner && step === 2 && (
                                <div className="winner-badge">
                                    <div className="confetti">🎉</div>
                                    <div className="trophy">👑</div>
                                    <div className="confetti">🎊</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button className="btn-restart" onClick={() => window.location.reload()}>
                重新開始
            </button>
        </div>
    );
};

export default GameOverScreen;
