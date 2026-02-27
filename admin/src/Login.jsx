import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, { email, password });
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError('ACCESS DENIED: INVALID CREDENTIALS');
        }
    };

    return (
        <div className="login-container">
            <motion.div
                className="login-box"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👁️</div>
                <h2 style={{ letterSpacing: '4px', textTransform: 'uppercase' }}>Admin Access</h2>
                <div style={{ width: '100%', height: '1px', background: '#333', margin: '20px 0' }}></div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>IDENTIFIER</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ADMIN@QMAZE"
                        />
                    </div>
                    <div className="input-group">
                        <label>SECURITY KEY</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                        />
                    </div>

                    {error && <div style={{ color: 'red', marginBottom: '20px', fontWeight: 'bold' }}>{error}</div>}

                    <button type="submit" className="btn-submit">
                        INITIATE_HANDSHAKE
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
