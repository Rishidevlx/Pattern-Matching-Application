import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaTrophy, FaCode, FaUsers, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                QMAZE_ADMIN
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaTrophy /> LEADERBOARD
                </NavLink>
                <NavLink to="/patterns" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaCode /> PATTERNS
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaCog /> SETTINGS
                </NavLink>
                <NavLink to="/participants" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FaUsers /> PARTICIPANTS
                </NavLink>
            </nav>

            <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid #333' }}>
                <FaSignOutAlt /> LOGOUT
            </div>
        </div>
    );
};

export default Sidebar;
