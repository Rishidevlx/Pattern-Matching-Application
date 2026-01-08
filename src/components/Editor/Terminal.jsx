import React, { useEffect, useRef } from 'react';

const Terminal = ({ logs = [], onClear }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="terminal-container" style={{
            height: '100%',
            background: '#0a0a10',
            color: '#00ff00',
            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            padding: '10px',
            overflowY: 'auto',
            fontSize: '0.9rem',
            borderTop: '2px solid #333',
            position: 'relative'
        }}>
            <div style={{
                marginBottom: '10px',
                color: '#888',
                borderBottom: '1px solid #333',
                paddingBottom: '5px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <span>&gt;_ SYSTEM_TERMINAL</span>
                <button
                    onClick={onClear}
                    style={{
                        background: 'transparent', border: '1px solid #333',
                        color: '#666', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px'
                    }}
                >
                    CLEAR
                </button>
            </div>
            {logs.length === 0 ? (
                <div style={{ opacity: 0.7 }}>
                    <div>C:\USERS\QMAZE&gt; system initialized...</div>
                    <div>C:\USERS\QMAZE&gt; waiting for compilation...</div>
                </div>
            ) : (
                logs.map((log, index) => (
                    <div key={index} style={{
                        marginBottom: '4px',
                        color: log.type === 'error' ? '#ff5555' :
                            log.type === 'system' ? '#00ffff' : '#00ff00',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {log.time && <span style={{ marginRight: '8px' }}>[{log.time}]</span>}
                        {log.text}
                    </div>
                ))
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default Terminal;
