import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ duration, onExpire, paused = false }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (paused || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onExpire) onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, paused, onExpire]);

    if (duration === 0) return null; // Timer disabled

    const percentage = (timeLeft / duration) * 100;
    const isUrgent = timeLeft <= 3;

    return (
        <div className={`countdown-timer ${isUrgent ? 'urgent' : ''}`}>
            <div className="timer-ring">
                <svg viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="timer-bg"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="timer-progress"
                        style={{
                            strokeDashoffset: 283 - (283 * percentage) / 100
                        }}
                    />
                </svg>
                <div className="timer-text">
                    {timeLeft}
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
