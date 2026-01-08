import React from 'react';
import Editor from "@monaco-editor/react";

const CodeEditor = ({ code, onChange, language = "c", readOnly = false, onPasteError }) => {

    const handleEditorChange = (value) => {
        onChange(value);
    };

    const editorOptions = {
        minimap: { enabled: true },
        fontSize: 16,
        fontFamily: 'Fira Code, Consolas, monospace',
        scrollBeyondLastLine: false,
        automaticLayout: true, // Vital for resizing
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: true,
        padding: { top: 20 },
        fontLigatures: true,
        readOnly: readOnly, // Use component prop
        domReadOnly: readOnly,
        lineNumbers: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true,
        contextmenu: true,
        renderLineHighlight: 'all',
        bracketPairColorization: {
            enabled: true
        }
    };

    const handleEditorDidMount = (editor, monaco) => {
        // No-op for now, logic moved to global effect for better security
    };

    // Advanced Security: Global Capture Phase Listener
    // We attach to the window with { capture: true } to intercept events BEFORE they reach Monaco.
    React.useEffect(() => {
        const handleGlobalPaste = (e) => {
            // CHECK ADMIN SETTING
            const pasteSecurityEnabled = sessionStorage.getItem('PASTE_SECURITY') === 'true';
            if (!pasteSecurityEnabled) return;

            // Check if the paste target is within our editor
            if (e.target.closest('.monaco-editor') || e.target.closest('.editor-wrapper')) {
                const lastCopy = parseInt(sessionStorage.getItem('last_copy_timestamp') || '0');
                const now = Date.now();
                const timeSinceCopy = now - lastCopy;

                // STRICT: If no internal copy or > 5 mins, BLOCK IT.
                if (!lastCopy || timeSinceCopy > 300000) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop Monaco from receiving it
                    if (onPasteError) onPasteError();
                }
            }
        };

        const handleCopy = (e) => {
            sessionStorage.setItem('last_copy_timestamp', Date.now());
        };

        // Capture phase is CRITICAL here
        window.addEventListener('paste', handleGlobalPaste, true);
        document.addEventListener('copy', handleCopy);

        return () => {
            window.removeEventListener('paste', handleGlobalPaste, true);
            document.removeEventListener('copy', handleCopy);
        };
    }, [onPasteError]);

    return (
        <div className="editor-wrapper" style={{
            height: '100%',
            width: '100%',
            borderRight: '1px solid #333',
            background: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative' // Ensure stacking context
        }}>
            <div className="pane-header" style={{
                height: '35px',
                padding: '5px 15px',
                background: '#1a1a2e',
                color: '#00f3ff',
                fontFamily: 'Orbitron',
                fontSize: '0.8rem',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
            }}>
                // CODE_EDITOR
            </div>

            {/* Main Editor Container */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* Absolute inset to force fill */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Editor
                        height="100%"
                        width="100%"
                        language={language}
                        value={code}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={editorOptions}
                        loading={<div style={{ color: '#00ffff', padding: '20px', fontFamily: 'Orbitron' }}>INITIALIZING_MATRIX_EDITOR...</div>}
                    />
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
