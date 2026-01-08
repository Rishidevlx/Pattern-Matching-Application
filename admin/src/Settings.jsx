import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Settings = () => {
    const [settings, setSettings] = useState({
        PASTE_SECURITY: 'true',
        FOCUS_SECURITY: 'true',
        SESSION_DURATION_MS: '3600000' // Default 1 hour
    });

    // Duration State
    const [duration, setDuration] = useState({ hours: 1, minutes: 0, seconds: 0, milis: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`);
            setSettings(res.data);

            // Parse MS to Time Units
            const ms = parseInt(res.data.SESSION_DURATION_MS || '3600000');
            if (!isNaN(ms)) {
                const h = Math.floor(ms / 3600000);
                const m = Math.floor((ms % 3600000) / 60000);
                const s = Math.floor((ms % 60000) / 1000);
                const mi = Math.floor((ms % 1000));
                setDuration({ hours: h, minutes: m, seconds: s, milis: mi });
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to load settings");
        }
    };

    const toggleSetting = async (key) => {
        const currentVal = settings[key] === 'true' || settings[key] === true;
        const newValue = !currentVal;

        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: String(newValue) }));

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, { key, value: String(newValue) });
        } catch (err) {
            console.error("Failed to update setting");
            // Revert on failure
            setSettings(prev => ({ ...prev, [key]: String(!newValue) }));
        }
    };

    const handleDurationChange = (field, val) => {
        setDuration(prev => ({ ...prev, [field]: parseInt(val) || 0 }));
    };

    const saveDuration = async () => {
        try {
            const totalMs = (duration.hours * 3600000) + (duration.minutes * 60000) + (duration.seconds * 1000) + duration.milis;
            await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, { key: 'SESSION_DURATION_MS', value: String(totalMs) });
            alert("Duration Updated Successfully!");
        } catch (err) {
            console.error("Failed to update duration");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>SYSTEM_CONTROLS</h2>

            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="setting-card" style={{
                    padding: '20px',
                    border: '1px solid #333',
                    background: '#050505',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0 }}>PASTE_SECURITY_PROTOCOL</h3>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                            Block external clipboard data. If OFF, participants can paste freely.
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSetting('PASTE_SECURITY')}
                        style={{
                            padding: '10px 20px',
                            background: (settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '#00ff41' : '#333',
                            color: (settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? '#000' : '#fff',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        {(settings.PASTE_SECURITY === 'true' || settings.PASTE_SECURITY === true) ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>

                <div className="setting-card" style={{
                    padding: '20px',
                    border: '1px solid #333',
                    background: '#050505',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0 }}>SESSION_DURATION</h3>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                            Exact duration configuration (HR : MIN : SEC : MS).
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {['hours', 'minutes', 'seconds', 'milis'].map((field, i) => (
                            <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    value={duration[field]}
                                    onChange={(e) => handleDurationChange(field, e.target.value)}
                                    placeholder={field.toUpperCase()}
                                    style={{
                                        background: '#111', border: '1px solid #333', color: '#00ff41',
                                        padding: '10px', width: '60px', fontFamily: 'Orbitron', fontWeight: 'bold', textAlign: 'center'
                                    }}
                                />
                                <span style={{ fontSize: '0.6rem', color: '#555', marginTop: '2px' }}>{field.toUpperCase()}</span>
                            </div>
                        ))}
                        <button
                            onClick={saveDuration}
                            style={{
                                padding: '10px 20px',
                                background: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginLeft: '10px',
                                height: '40px'
                            }}
                        >
                            SAVE
                        </button>
                    </div>
                </div>

                <div className="setting-card" style={{
                    padding: '20px',
                    border: '1px solid #333',
                    background: '#050505',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0 }}>FOCUS_TRAP_PROTOCOL</h3>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                            Detect and warn when window focus is lost.
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSetting('FOCUS_SECURITY')}
                        style={{
                            padding: '10px 20px',
                            background: (settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '#00ff41' : '#333',
                            color: (settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? '#000' : '#fff',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        {(settings.FOCUS_SECURITY === 'true' || settings.FOCUS_SECURITY === true) ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Settings;
