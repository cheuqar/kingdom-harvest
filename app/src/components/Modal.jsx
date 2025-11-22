import React from 'react';
import './Modal.css';

const Modal = ({ children, title }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {title && <div className="modal-header"><h2>{title}</h2></div>}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
