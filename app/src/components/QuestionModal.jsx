import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import Modal from './Modal';
import CountdownTimer from './CountdownTimer';
import './QuestionModal.css';

const QuestionModal = () => {
    const { state, dispatch } = useGame();
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [autoCloseTimer, setAutoCloseTimer] = useState(null);
    const question = state.currentQuestion;

    const handleSelectOption = (option) => {
        setSelectedOption(option);
        setShowResult(true);

        // Auto-close after delay for wrong answers
        const isAnswerCorrect = option === question.answer;
        if (!isAnswerCorrect) {
            const timer = setTimeout(() => {
                handleWrong();
            }, 2500); // 2.5 seconds to show correct answer
            setAutoCloseTimer(timer);
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
        };
    }, [autoCloseTimer]);

    const handleCorrect = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        dispatch({ type: 'SET_QUESTION', payload: null });
        setSelectedOption(null);
        setShowResult(false);
        // Proceed to buy option
        // Phase is already DRAW_LAND, so MainArea will render the Buy buttons now that question is null
    };

    const handleWrong = () => {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        dispatch({ type: 'ADD_TO_AUCTION', payload: state.currentCard });
        dispatch({ type: 'SET_QUESTION', payload: null });
        dispatch({ type: 'ADD_LOG', payload: '回答錯誤，無法購買土地，土地進入拍賣池。' });
        setSelectedOption(null);
        setShowResult(false);
        dispatch({ type: 'NEXT_TURN' });
    };

    if (!question) return null;

    const isCorrect = selectedOption === question.answer;

    return (
        <>
            {state.actionTimer > 0 && (
                <CountdownTimer
                    duration={state.actionTimer}
                    onExpire={handleWrong}
                />
            )}
            <Modal title="聖經問答">
                <div className="question-card-content">
                    <p className="question-text">{question.question}</p>

                    {/* Multiple Choice Options */}
                    {question.options && !showResult && (
                        <div className="options-grid">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`btn-option ${selectedOption === option ? 'selected' : ''}`}
                                    onClick={() => handleSelectOption(option)}
                                >
                                    {String.fromCharCode(65 + index)}. {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Show result after selection */}
                    {showResult && (
                        <div className={`answer-section ${isCorrect ? 'correct' : 'wrong'}`}>
                            <div className={`result-indicator ${isCorrect ? 'correct' : 'wrong'}`}>
                                {isCorrect ? '✓ 正確！' : '✗ 錯誤！'}
                            </div>
                            {!isCorrect && (
                                <p className="selected-answer">
                                    您的答案：<span className="wrong">{selectedOption}</span>
                                </p>
                            )}
                            <p className="answer-text">正確答案：{question.answer}</p>
                            <div className="judge-buttons">
                                {isCorrect ? (
                                    <button className="btn-success" onClick={handleCorrect}>繼續購買</button>
                                ) : (
                                    <button className="btn-secondary" onClick={handleWrong}>確定</button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fallback for questions without options */}
                    {!question.options && !showResult && (
                        <button className="btn-primary" onClick={() => setShowResult(true)}>顯示答案</button>
                    )}

                    {/* Manual judge for non-multiple-choice */}
                    {!question.options && showResult && (
                        <div className="answer-section">
                            <p className="answer-text">答案：{question.answer}</p>
                            <div className="judge-buttons">
                                <button className="btn-success" onClick={handleCorrect}>答對 (購買)</button>
                                <button className="btn-secondary" onClick={handleWrong}>答錯 (放棄)</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default QuestionModal;
