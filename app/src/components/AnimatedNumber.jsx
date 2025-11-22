import React, { useEffect, useState, useRef } from 'react';
import './AnimatedNumber.css';

const AnimatedNumber = ({ value, prefix = '', suffix = '', className = '', showChange = true }) => {
    // Ensure value is a number
    const numericValue = Number(value);
    const [displayValue, setDisplayValue] = useState(numericValue);
    const [change, setChange] = useState(null);
    const prevValueRef = useRef(numericValue);
    const animationRef = useRef(null);

    useEffect(() => {
        const prevValue = prevValueRef.current;

        if (prevValue !== numericValue) {
            const diff = numericValue - prevValue;

            // Show floating change indicator
            if (showChange && diff !== 0) {
                setChange(diff);
                setTimeout(() => setChange(null), 2000);
            }

            // Cancel any existing animation
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            const startTime = performance.now();
            const duration = 800; // ms
            const startValue = displayValue; // Continue from current display value (smooth transition)

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);

                const current = startValue + (numericValue - startValue) * ease;
                setDisplayValue(current);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setDisplayValue(numericValue); // Ensure exact final value
                }
            };

            animationRef.current = requestAnimationFrame(animate);
            prevValueRef.current = numericValue;
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [numericValue, showChange]); // Removed displayValue from dependencies

    return (
        <span className={`animated-number ${className} ${change ? 'changing' : ''}`}>
            {prefix}{Math.round(displayValue)}{suffix}
            {change !== null && (
                <span className={`change-indicator ${change > 0 ? 'positive' : 'negative'}`}>
                    {change > 0 ? '+' : ''}{change}
                </span>
            )}
        </span>
    );
};

export default AnimatedNumber;
