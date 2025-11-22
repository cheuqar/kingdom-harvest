import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import Modal from './Modal';
import './QuestionModal.css';

const QuestionModal = () => {
    const { state, dispatch } = useGame();
    const [showAnswer, setShowAnswer] = useState(false);
    const question = state.currentQuestion;

    const handleCorrect = () => {
        dispatch({ type: 'SET_QUESTION', payload: null });
        // Proceed to buy option
        // Phase is already DRAW_LAND, so MainArea will render the Buy buttons now that question is null
    };

    const handleWrong = () => {
        dispatch({ type: 'ADD_TO_AUCTION', payload: state.currentCard });
        dispatch({ type: 'SET_QUESTION', payload: null });
        dispatch({ type: 'ADD_LOG', payload: '回答錯誤，無法購買土地，土地進入拍賣池。' });
        dispatch({ type: 'NEXT_TURN' });
    };

    if (!question) return null;

    return (
        <Modal title="聖經問答">
            <div className="question-card-content">
                <p className="question-text">{question.question}</p>

                {showAnswer ? (
                    <div className="answer-section">
                        <p className="answer-text">答案：{question.answer}</p>
                        <div className="judge-buttons">
                            <button className="btn-success" onClick={handleCorrect}>答對 (購買)</button>
                            <button className="btn-secondary" onClick={handleWrong}>答錯 (放棄)</button>
                        </div>
                    </div>
                ) : (
                    <button className="btn-primary" onClick={() => setShowAnswer(true)}>顯示答案</button>
                )}
            </div>
        </Modal>
    );
};

export default QuestionModal;
