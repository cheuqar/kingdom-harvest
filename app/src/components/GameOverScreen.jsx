import React, { useState, useEffect } from 'react';
import './GameOverScreen.css';

const GameOverScreen = ({ winner }) => {
    const [animationPhase, setAnimationPhase] = useState('initial'); // initial, calculating, final

    const rankings = winner?.rankings || [];
    const reason = winner?.reason || 'bankruptcy';
    const totalSeeds = winner?.totalSeeds || 0;
    const hasSeedBonus = totalSeeds > 0;

    useEffect(() => {
        // Phase 1: Show initial state
        const timer1 = setTimeout(() => {
            setAnimationPhase('calculating');
        }, 1500);

        // Phase 2: Calculating seeds
        const timer2 = setTimeout(() => {
            setAnimationPhase('final');
        }, hasSeedBonus ? 5000 : 2500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [hasSeedBonus]);

    const getReasonText = () => {
        switch (reason) {
            case 'time': return '⏰ 時間到';
            case 'admin_forced': return '⚠️ 管理員結束';
            case 'bankruptcy': return '💰 破產決勝';
            default: return '';
        }
    };

    return (
        <div className="gameover-container">
            <div className="gameover-header">
                <h1 className="gameover-title">
                    {animationPhase === 'final' ? '🏆 最終結果 🏆' : '遊戲結束'}
                </h1>
                <div className="gameover-subtitle">{getReasonText()}</div>
            </div>

            {hasSeedBonus && animationPhase === 'calculating' && (
                <div className="seed-calculator-banner">
                    <div className="seed-calculator-content">
                        <div className="seed-icon">🌱</div>
                        <div className="seed-text">
                            <h2>計算種子加成中...</h2>
                            <p>你的種子將決定最終排名！</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={`rankings-grid ${animationPhase}`}>
                {rankings.map((team, index) => {
                    const isWinner = index === 0;

                    return (
                        <div
                            key={team.id}
                            className={`team-card ${isWinner && animationPhase === 'final' ? 'winner' : ''} rank-${index + 1}`}
                            style={{
                                '--team-color': team.color,
                                '--delay': `${index * 0.1}s`
                            }}
                        >
                            {/* Rank Badge */}
                            <div className="rank-badge">
                                {animationPhase === 'final' && isWinner ? (
                                    <div className="winner-crown">👑</div>
                                ) : (
                                    <div className="rank-number">#{index + 1}</div>
                                )}
                            </div>

                            {/* Team Name */}
                            <div className="team-name-section">
                                <h2 className="team-name">{team.name}</h2>
                            </div>

                            {/* Stats Grid */}
                            <div className="stats-container">
                                <div className="stat-item">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-content">
                                        <div className="stat-label">現金</div>
                                        <div className="stat-value">${team.cash.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon">🏠</div>
                                    <div className="stat-content">
                                        <div className="stat-label">土地 ({team.landCount})</div>
                                        <div className="stat-value">${team.landValue.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="stat-item highlight">
                                    <div className="stat-icon">💼</div>
                                    <div className="stat-content">
                                        <div className="stat-label">基礎資產</div>
                                        <div className="stat-value">${team.baseAssets.toLocaleString()}</div>
                                    </div>
                                </div>

                                {hasSeedBonus && (
                                    <>
                                        <div className={`stat-item seed-stat ${animationPhase !== 'initial' ? 'show' : ''}`}>
                                            <div className="stat-icon">🌱</div>
                                            <div className="stat-content">
                                                <div className="stat-label">
                                                    種子 ({team.seeds || 0}/{totalSeeds})
                                                </div>
                                                <div className="stat-value seed-percentage">
                                                    {(team.seedMultiplier * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`stat-item bonus-stat ${animationPhase === 'calculating' || animationPhase === 'final' ? 'show' : ''}`}>
                                            <div className="stat-icon">✨</div>
                                            <div className="stat-content">
                                                <div className="stat-label">種子獎勵</div>
                                                <div className="stat-value bonus-value">
                                                    +${team.seedBonus.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={`stat-item final-stat ${animationPhase === 'final' || !hasSeedBonus ? 'show' : ''}`}>
                                    <div className="stat-icon">🏆</div>
                                    <div className="stat-content">
                                        <div className="stat-label">最終得分</div>
                                        <div className="stat-value final-value">
                                            ${team.finalScore.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isWinner && animationPhase === 'final' && (
                                <div className="winner-decoration">
                                    <span className="confetti-left">🎉</span>
                                    <span className="confetti-right">🎊</span>
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
