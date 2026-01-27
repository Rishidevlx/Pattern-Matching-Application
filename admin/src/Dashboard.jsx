import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            }
        };

        // Poll every 3 seconds
        const interval = setInterval(fetchLeaderboard, 3000);
        fetchLeaderboard();

        return () => clearInterval(interval);
    }, []);

    const formatTime = (ms) => {
        if (!ms) return '00:00:00';
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const mili = Math.floor((ms % 1000) / 10);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${mili.toString().padStart(2, '0')}`;
    };

    // Calculate Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const finishedUsers = users.filter(u => u.status === 'finished').length;
    const disqualifiedUsers = users.filter(u => u.status === 'disqualified').length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="dashboard-container"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#00ff41', borderRadius: '50%', boxShadow: '0 0 10px #00ff41', animation: 'pulse 2s infinite' }}></span>
                    LIVE_LEADERBOARD
                </h2>
                <div style={{ fontSize: '0.9rem', opacity: 0.7, fontFamily: 'monospace' }}>
                    SYSTEM STATUS: ONLINE | SYNC: AUTO (3s)
                </div>
            </div>

            {/* STATS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <StatCard label="TOTAL CANDIDATES" value={totalUsers} color="#fff" />
                <StatCard label="ACTIVE SESSIONS" value={activeUsers} color="#00ffff" />
                <StatCard label="QUALIFIED" value={finishedUsers} color="#00ff41" />
                <StatCard label="DISQUALIFIED" value={disqualifiedUsers} color="#ff0055" />
            </div>

            <div style={{ background: '#050505', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <table>
                    <thead>
                        <tr style={{ background: '#111' }}>
                            <th style={{ width: '60px', padding: '15px', textAlign: 'center' }}>RANK</th>
                            <th>OPERATOR (ID)</th>
                            <th>COLLEGE</th>
                            <th>STATUS</th>
                            <th>PATTERNS</th>
                            <th>TIME (HR:MN:SC:MS)</th>
                            <th>NO OF LOOP</th>
                            <th>LOC</th>
                            <th>WARNINGS</th>
                            <th>ATTEMPTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <motion.tr
                                key={user.lot_number}
                                className={`rank-row rank-${index + 1}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{ borderBottom: '1px solid #222' }}
                            >
                                <td style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: index < 3 ? 'inherit' : '#555' }}>
                                    {index === 0 ? '👑' : `#${index + 1}`}
                                </td>
                                <td>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{user.lot_name}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '1px' }}>{user.lot_number}</div>
                                </td>
                                <td style={{ color: '#00ccff', fontSize: '0.9rem' }}>{user.college_name || '-'}</td>
                                <td>
                                    <StatusBadge status={user.status} />
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#00ffff' }}>{user.patterns_completed || 0}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#00ff41' }}>{formatTime(user.total_time)}</td>
                                <td style={{ fontWeight: 'bold', color: '#ffcc00' }}>{user.no_of_loops || 0}</td>
                                <td style={{ fontWeight: 'bold' }}>{user.lines_of_code}</td>
                                <td>
                                    {user.warnings > 0 ? (
                                        <span style={{ color: '#ff0055', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            ⚠️ {user.warnings}
                                        </span>
                                    ) : <span style={{ opacity: 0.3 }}>-</span>}
                                </td>
                                <td>{user.attempts}</td>
                            </motion.tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#333' }}>
                                    /// WAITING FOR SIGNALS...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div style={{ background: '#0a0a0a', border: `1px solid ${color}40`, padding: '20px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.7rem', color: color, letterSpacing: '2px', marginBottom: '5px' }}>{label}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', textShadow: `0 0 15px ${color}60` }}>{value}</div>
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '50px', height: '50px', background: color, filter: 'blur(30px)', opacity: 0.2 }}></div>
    </div>
);

const StatusBadge = ({ status }) => {
    let color = '#fff';
    let bg = '#333';

    if (status === 'active') { color = '#00ffff'; bg = 'rgba(0, 255, 255, 0.1)'; }
    if (status === 'finished') { color = '#00ff41'; bg = 'rgba(0, 255, 65, 0.1)'; }
    if (status === 'disqualified') { color = '#ff0055'; bg = 'rgba(255, 0, 85, 0.1)'; }

    return (
        <span style={{
            background: bg,
            color: color,
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: `1px solid ${color}40`,
            textTransform: 'uppercase',
            letterSpacing: '1px'
        }}>
            {status}
        </span>
    );
};

export default Dashboard;
