import React from 'react';
import './ErrorModal.css';

/**
 * Error Modal component that displays error information to users
 * with options to retry or dismiss the error
 */
function ErrorModal({ error, errorInfo, onRetry, onDismiss, level = 'error' }) {
  const isWarning = level === 'warning';

  return (
    <div className="error-modal-overlay">
      <div className={`error-modal ${isWarning ? 'warning' : ''}`}>
        <div className="error-modal-header">
          <span className="error-icon">{isWarning ? '⚠️' : '❌'}</span>
          <h2>{isWarning ? 'Warning' : 'Something went wrong'}</h2>
        </div>

        <div className="error-modal-body">
          <p className="error-message">
            {error?.message || 'An unexpected error occurred'}
          </p>

          {errorInfo && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <pre className="error-stack">
                {error?.stack || 'No stack trace available'}
              </pre>
              {errorInfo.componentStack && (
                <>
                  <p className="error-component-label">Component Stack:</p>
                  <pre className="error-component-stack">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </details>
          )}
        </div>

        <div className="error-modal-actions">
          {onRetry && (
            <button className="error-btn error-btn-primary" onClick={onRetry}>
              Try Again
            </button>
          )}
          {onDismiss && (
            <button className="error-btn error-btn-secondary" onClick={onDismiss}>
              {isWarning ? 'OK' : 'Continue Anyway'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
