import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import CardDisplay from './CardDisplay';
import Modal from './Modal';
import './LogPanel.css';

const LogPanel = () => {
    const { state, dispatch } = useGame();
    const { currentTeam, useMiracle } = useGameEngine();
    const endRef = useRef(null);
    const [confirmingMiracle, setConfirmingMiracle] = useState(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.log]);

    const handleMiracleClick = (card) => {
        setConfirmingMiracle(card);

        // If it's a rent series card, highlight the series
        if (card.effectCode === 'E_COLLECT_RENT_SERIES' && card.params?.series) {
            dispatch({ type: 'SET_HIGHLIGHTED_SERIES', payload: card.params.series });
        }
    };

    const handleConfirmMiracle = () => {
        if (confirmingMiracle) {
            useMiracle(confirmingMiracle);
            setConfirmingMiracle(null);
            dispatch({ type: 'CLEAR_HIGHLIGHTED_SERIES' });
        }
    };

    const handleCancelMiracle = () => {
        setConfirmingMiracle(null);
        dispatch({ type: 'CLEAR_HIGHLIGHTED_SERIES' });
    };

    return (
        <div className="log-panel">
            {/* Miracle Cards Section */}
            {currentTeam.miracles.length > 0 && (
                <div className="miracle-cards-section">
                    <h3>我的神蹟卡</h3>
                    <div className="miracle-cards-list">
                        {currentTeam.miracles.map((card, i) => (
                            <div key={i} className="miracle-card-item">
                                <span className="miracle-card-name">{card.name}</span>
                                <button className="btn-use-miracle" onClick={() => handleMiracleClick(card)}>使用</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Log Section */}
            <div className="game-log-section">
                <h3>遊戲紀錄</h3>
                <div className="log-list">
                    {state.log.map((entry, i) => (
                        <div key={i} className="log-entry">
                            <span className="log-time">#{i + 1}</span>
                            <span className="log-text">{entry}</span>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
            </div>

            {/* Miracle Confirmation Modal */}
            {confirmingMiracle && (
                <Modal title="使用神蹟卡">
                    <div className="modal-card-display">
                        <CardDisplay card={confirmingMiracle} type="event" />
                    </div>
                    <div className="modal-text" style={{ textAlign: 'center', margin: '10px 0' }}>
                        <p>確定要使用這張卡嗎？</p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-success" onClick={handleConfirmMiracle}>確定使用</button>
                        <button className="btn-secondary" onClick={handleCancelMiracle}>取消</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default LogPanel;
