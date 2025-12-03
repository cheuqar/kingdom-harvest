import React from 'react';
import './DeviceTakeoverToast.css';

const DeviceTakeoverToast = ({ pendingTakeover, teamName, teamColor, onConfirm, onReject }) => {
    if (!pendingTakeover) return null;

    return (
        <div className="takeover-toast">
            <div className="toast-content">
                <div className="toast-icon">📱</div>
                <div className="toast-message">
                    <span className="toast-title">裝置接管請求</span>
                    <span className="toast-team" style={{ color: teamColor }}>{teamName}</span>
                </div>
                <div className="toast-actions">
                    <button className="toast-btn accept" onClick={onConfirm} title="允許接管">
                        ✓
                    </button>
                    <button className="toast-btn reject" onClick={onReject} title="拒絕">
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceTakeoverToast;
