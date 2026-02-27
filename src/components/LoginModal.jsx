import React, { useState } from 'react';
import './LoginModal.css';

const LoginModal = ({ onLogin, onBack }) => {
    const [lotNo, setLotNo] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!lotNo) {
            setError('ACCESS DENIED: MISSING LOT NUMBER');
            return;
        }

        // Save session data to localStorage (dummy values for backward compatibility)
        const sessionData = {
            lotNo,
            lotName: `User_${lotNo}`,
            collegeName: 'N/A',
            loginTime: Date.now()
        };
        localStorage.setItem('qmaze_user_session', JSON.stringify(sessionData));

        onLogin(lotNo, sessionData.lotName, sessionData.collegeName);
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
