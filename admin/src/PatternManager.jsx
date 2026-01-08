import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const PatternManager = () => {
    const [patterns, setPatterns] = useState([]);
    const [newName, setNewName] = useState('');
    const [newLevel, setNewLevel] = useState(1);
    const [newPattern, setNewPattern] = useState('');
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/patterns`)
            .then(res => setPatterns(res.data))
            .catch(err => console.error(err));
    }, [refresh]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/patterns`, {
                name: newName,
                levelOrder: newLevel,
                targetOutput: newPattern
            });
            setRefresh(!refresh);
            setNewName('');
            setNewPattern('');
            setNewLevel(prev => prev + 1);
        } catch (err) {
            alert('Failed to create pattern');
        }
    };

    const [deleteId, setDeleteId] = useState(null);

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/patterns/${deleteId}`);
            setRefresh(prev => !prev);
            setDeleteId(null);
        } catch (err) {
            alert('Delete Failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pattern-container"
            style={{ position: 'relative' }}
        >
            {/* CUSTOM DELETE MODAL */}
            {deleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            background: '#0a0a0a', border: '1px solid #ff0000', pading: '2px',
                            minWidth: '400px', boxShadow: '0 0 30px rgba(255, 0, 0, 0.3)'
                        }}
                    >
                        <div style={{ background: '#ff0000', color: '#000', padding: '10px 20px', fontWeight: 'bold' }}>
                            ⚠️ SYSTEM WARNING
                        </div>
                        <div style={{ padding: '30px', textAlign: 'center', color: '#fff' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>CONFIRM DELETION?</div>
                            <div style={{ opacity: 0.7, marginBottom: '30px' }}>This action cannot be undone. Algorithm data will be lost.</div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    style={{
                                        padding: '10px 30px', background: 'transparent',
                                        border: '1px solid #333', color: '#fff', cursor: 'pointer'
                                    }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        padding: '10px 30px', background: '#ff0000',
                                        border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    CONFIRM_DELETE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>PATTERN_MANAGER</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>

                {/* CREATE PANEL */}
                <div style={{ background: '#050505', border: '1px solid #333', padding: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#00ff41' }}>[ NEW_PATTERN_PROTOCOL ]</h3>

                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem' }}>PATTERN_NAME</label>
                            <input
                                style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff' }}
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Diamond Pyramid"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem' }}>LEVEL_ORDER</label>
                            <input
                                type="number"
                                style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff' }}
                                value={newLevel}
                                onChange={e => setNewLevel(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem' }}>TARGET_OUTPUT (PRESERVES SPACING)</label>
                            <textarea
                                style={{
                                    width: '100%', height: '200px',
                                    padding: '10px',
                                    background: '#111',
                                    border: '1px solid #333',
                                    color: '#00ff41',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre'
                                }}
                                value={newPattern}
                                onChange={e => setNewPattern(e.target.value)}
                                placeholder="Type your pattern here..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: '100%', padding: '12px',
                                background: '#00ff41', color: '#000', fontWeight: 'bold',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            UPLOAD_PATTERN_TO_DB
                        </button>
                    </form>
                </div>

                {/* LIST PANEL */}
                <div style={{ background: '#050505', border: '1px solid #333', padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, color: '#00ff41' }}>[ DEPLOYED_PATTERNS ]</h3>

                    {patterns.map(p => (
                        <div key={p.id} style={{ marginBottom: '20px', border: '1px solid #333', padding: '15px', background: '#0a0a0a', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold', color: '#fff' }}>#{p.level_order} {p.name}</span>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>ID: {p.id}</span>
                                    <button
                                        onClick={() => setDeleteId(p.id)}
                                        style={{ background: '#ff0000', border: 'none', color: '#fff', padding: '2px 8px', cursor: 'pointer', fontSize: '0.7rem' }}
                                    >
                                        DEL
                                    </button>
                                </div>
                            </div>
                            <pre style={{
                                background: '#000',
                                padding: '10px',
                                border: '1px dashed #333',
                                color: '#00ff41',
                                margin: 0,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {p.target_output}
                            </pre>
                        </div>
                    ))}
                    {patterns.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center' }}>NO PATTERNS FOUND</div>}
                </div>
            </div>
        </motion.div>
    );
};

export default PatternManager;
