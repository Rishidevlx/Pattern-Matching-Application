import React, { useState } from 'react';
import './LoginModal.css';

const LoginModal = ({ onLogin, onBack }) => {
    const [lotNo, setLotNo] = useState('');
    const [lotName, setLotName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!lotNo || !lotName) {
            setError('ACCESS DENIED: MISSING CREDENTIALS');
            return;
        }
        onLogin(lotNo, lotName);
    };

    return (
        <div className="login-overlay">
            <div className="login-frame">
                <div className="login-header">
                    <div className="scanner-line"></div>
                    <h2 className="login-title">SYSTEM ACCESS</h2>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-field-container">
                        <label>LOT NUMBER</label>
                        <div className="input-wrapper">
                            <span className="input-prefix">#</span>
                            <input
                                type="text"
                                value={lotNo}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) setLotNo(val);
                                }}
                                placeholder="00"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="input-field-container">
                        <label>LOT NAME</label>
                        <div className="input-wrapper">
                            <span className="input-prefix">&gt;</span>
                            <input
                                type="text"
                                value={lotName}
                                onChange={(e) => setLotName(e.target.value)}
                                placeholder="ALPHA_SQUAD"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {error && <div className="error-msg">system_alert: {error}</div>}

                    <div className="action-buttons">
                        <button type="button" className="ghost-btn" onClick={onBack}>ABORT</button>
                        <button type="submit" className="neon-btn">INITIATE_SESSION</button>
                    </div>
                </form>

                <div className="login-footer">
                    <span>SECURE CONNECTION</span>
                    <span>QMAZE_PROTOCOL_V2.6</span>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
