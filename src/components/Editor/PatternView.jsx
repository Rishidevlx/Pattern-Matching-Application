import React from 'react';
import { motion } from 'framer-motion';

const PatternView = ({ pattern, levelName }) => {
    return (
        <div className="pattern-wrapper" style={{
            height: '100%', width: '100%',
            background: '#050510', position: 'relative',
            display: 'flex', flexDirection: 'column'
        }}>
            <div className="pane-header" style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a1a2e',
                color: '#ff00ff',
                fontFamily: 'Orbitron',
            }}>
                <pre style={{
                    color: '#ff00ff',
                    textShadow: '0 0 5px #ff00ff',
                    fontFamily: 'monospace',
                    fontSize: '1.5rem', // Increased size for better look
                    lineHeight: '1.5',
                    margin: 0
                }}>
                    {pattern}
                </pre>
            </div>

            <div style={{
                textAlign: 'center',
                padding: '10px',
                borderTop: '1px solid #333',
                fontSize: '0.8rem',
                color: '#666'
            }}>
                LEVEL: {levelName || "UNKNOWN"}
            </div>
        </div>
    );
};

export default PatternView;
