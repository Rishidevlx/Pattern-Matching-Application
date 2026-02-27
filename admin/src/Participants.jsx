import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaEye, FaCode, FaTimes } from 'react-icons/fa';

const Participants = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); // For Code View Modal
    const [deleteConfirm, setDeleteConfirm] = useState(null); // For Delete Confirmation
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        fetchParticipants();
        const interval = setInterval(fetchParticipants, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchParticipants = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/participants`);
            setParticipants(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch participants");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/participants/${deleteConfirm.lot_number}`);
            setParticipants(participants.filter(p => p.lot_number !== deleteConfirm.lot_number));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete user");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;

        setIsBulkDeleting(true);
        try {
            // Delete one by one as there is no bulk endpoint
            await Promise.all(selectedIds.map(id =>
                axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/participants/${id}`)
            ));
            setParticipants(participants.filter(p => !selectedIds.includes(p.lot_number)));
            setSelectedIds([]);
        } catch (err) {
            console.error("Bulk delete failed");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredParticipants.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredParticipants.map(p => p.lot_number));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const formatTime = (ms) => {
        if (!ms) return "00:00:00";
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Helper to parse code_data
    const parseCodeData = (data) => {
        if (!data) return { "Main": "No code submitted." };
        try {
            // Try parsing as JSON first (codeMap)
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object') {
                // If it's the new nested structure { language, map }
                if (parsed.map) return parsed.map;
                return parsed;
            }
            return { "Main": data }; // fallback
        } catch (e) {
            return { "Main": data }; // plain text fallback
        }
    };

    // Filter Logic
    const filteredParticipants = participants.filter(user => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (user.lot_name?.toLowerCase() || '').includes(term) ||
            (user.lot_number?.toString().toLowerCase() || '').includes(term) ||
            (user.college_name?.toLowerCase() || '').includes(term);

        const matchesFilter = filterStatus === 'all' || user.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="participants-page">
            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>PARTICIPANT_DATABASE</h2>

            {/* CONTROLS */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '20px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by Name, Lot #, or College..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        background: '#111',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '4px',
                        flex: 1,
                        outline: 'none',
                        fontFamily: 'Consolas'
                    }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        background: '#111',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '4px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Consolas'
                    }}
                >
                    <option value="all">ALL STATUS</option>
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                    <option value="disqualified">Disqualified</option>
                </select>

                {selectedIds.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        style={{
                            padding: '10px 20px',
                            background: '#ff0055',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'Orbitron',
                            fontWeight: 'bold',
                            boxShadow: '0 0 15px rgba(255, 0, 85, 0.4)'
                        }}
                    >
                        {isBulkDeleting ? 'TERMINATING...' : `DELETE SELECTED (${selectedIds.length})`}
                    </motion.button>
                )}
            </div>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                    <thead>
                        <tr style={{ background: '#0a0a0a', color: '#00ff41', borderBottom: '2px solid #00ff41' }}>
                            <th style={{ padding: '15px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    onChange={toggleSelectAll}
                                    checked={selectedIds.length === filteredParticipants.length && filteredParticipants.length > 0}
                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                />
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>LOT NO</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>PATTERN FINISHED</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>LOOP COUNT</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>TIME (HR:MN:SC:MS)</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>LOC</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>WARNING</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>STATUS</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.map(user => (
                            <tr key={user.lot_number} style={{ borderBottom: '1px solid #333', background: selectedIds.includes(user.lot_number) ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }}>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(user.lot_number)}
                                        onChange={() => toggleSelect(user.lot_number)}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{user.lot_number}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user.lot_name || 'USER'}</div>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#00ffff' }}>{user.patterns_completed || 0}</td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#ffcc00' }}>{user.no_of_loops || 0}</td>
                                <td style={{ padding: '15px', textAlign: 'center', fontFamily: 'monospace', color: '#00ff41' }}>{formatTime(user.total_time)}</td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{user.lines_of_code || 0}</td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    {user.warnings > 0 ? (
                                        <span style={{ color: '#ff0055', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                            ⚠️ {user.warnings}
                                        </span>
                                    ) : <span style={{ opacity: 0.3 }}>-</span>}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{
                                        color: user.status === 'finished' ? '#00ff41' : user.status === 'active' ? '#00ffff' : '#ff0055',
                                        fontWeight: 'bold', border: '1px solid currentColor', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem'
                                    }}>
                                        {user.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        style={{ background: 'none', border: '1px solid #00ffff', color: '#00ffff', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                                        title="View Code"
                                    >
                                        <FaCode />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(user)}
                                        style={{ background: 'none', border: '1px solid #ff0055', color: '#ff0055', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                                        title="Delete User"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}
                    >
                        <div style={{
                            background: '#000', border: '1px solid #ff0000', padding: '30px',
                            textAlign: 'center', boxShadow: '0 0 30px rgba(255,0,0,0.3)', maxWidth: '400px'
                        }}>
                            <h2 style={{ color: '#ff0000', marginTop: 0 }}>Terminating User</h2>
                            <p>Are you sure you want to delete Lot {deleteConfirm.lot_number}?</p>
                            <p style={{ fontSize: '0.8rem', color: '#888' }}>This action cannot be undone.</p>

                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #666', color: '#fff', cursor: 'pointer' }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleDelete}
                                    style={{ padding: '10px 20px', background: '#ff0000', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CODE VIEWER MODAL */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}
                    >
                        <div style={{
                            width: '80%', height: '80%', background: '#111', border: '1px solid #00ff41',
                            display: 'flex', flexDirection: 'column', boxShadow: '0 0 50px rgba(0,255,65,0.2)'
                        }}>
                            <div style={{
                                padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#001100'
                            }}>
                                <h3 style={{ margin: 0, color: '#00ff41' }}>SOURCE_CODE_VIEWER: {selectedUser.lot_number}</h3>
                                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}><FaTimes /></button>
                            </div>

                            <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
                                <CodeViewer codeData={parseCodeData(selectedUser.code_data)} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Sub-component for Tabs inside Code Viewer
const CodeViewer = ({ codeData }) => {
    const keys = Object.keys(codeData);
    const [activeTab, setActiveTab] = useState(keys[0] || 'Main');

    if (keys.length === 0) return <div style={{ padding: '20px', color: '#666' }}>No code data available.</div>;

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Sidebar Tabs */}
            <div style={{ width: '200px', borderRight: '1px solid #333', background: '#050505', overflowY: 'auto' }}>
                {keys.map(key => (
                    <div
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            padding: '15px',
                            cursor: 'pointer',
                            background: activeTab === key ? '#003300' : 'transparent',
                            color: activeTab === key ? '#00ff41' : '#888',
                            borderLeft: activeTab === key ? '3px solid #00ff41' : '3px solid transparent'
                        }}
                    >
                        {key.length > 20 ? key.substring(0, 20) + '...' : key === 'Main' ? 'Last Snapshot' : `Pattern ${key}`}
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, background: '#1e1e1e', padding: '20px', overflow: 'auto' }}>
                <pre style={{
                    margin: 0,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: '14px',
                    color: '#d4d4d4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: '1.5'
                }}>
                    {codeData[activeTab]}
                </pre>
            </div>
        </div>
    );
};

export default Participants;
