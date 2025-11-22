import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ children, title }) => {
    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                {title && <div className="modal-header"><h2>{title}</h2></div>}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
