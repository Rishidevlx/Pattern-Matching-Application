import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import PatternView from './PatternView';
import Terminal from './Terminal';


// REMOVED HARDCODED PATTERN

const EditorLayout = ({ userData }) => {
    // STAGE CONSTANTS
    const STORAGE_KEY_MAP = `qmaze_codemap_${userData.lotNo}`;
    const STORAGE_KEY_COMPLETED = `qmaze_completed_${userData.lotNo}`;

    // Stores code for each pattern: { [patternId]: "code..." }
    const [codeMap, setCodeMap] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_MAP);
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    // Helper to get default code based on language
    const getDefaultCode = (lang) => {
        return lang === 'c'
            ? '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}'
            : '// Welcome to QMAZE 2K26\npublic class Main {\n    public static void main(String[] args) {\n        // Write your pattern logic here\n    }\n}';
    };

    // Current active code (derived from map)
    const [language, setLanguage] = useState('c');
    const [initialDuration, setInitialDuration] = useState(3600000);
    const [metrics, setMetrics] = useState({ time: 3600000 });
    const [isRunning, setIsRunning] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [warningCount, setWarningCount] = useState(0); // Security Warning Counter
    const [isDisqualified, setIsDisqualified] = useState(false);

    // Pattern State
    const [currentPattern, setCurrentPattern] = useState(null);
    const [allPatterns, setAllPatterns] = useState([]);

    // Track completed IDs (Persisted)
    const [completedPatterns, setCompletedPatterns] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COMPLETED);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [showLevelSuccess, setShowLevelSuccess] = useState(false); // New state for temporary success overlay

    // --- PERSISTENCE EFFECT ---
    useEffect(() => {
        if (userData.lotNo) {
            localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(codeMap));
            localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedPatterns));
        }
    }, [codeMap, completedPatterns, userData]);

    // Fetch Patterns on Mount
    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/patterns`);
                const data = await res.json();
                setAllPatterns(data);
                // Set first level pattern if not set
                // Set first level pattern if not set
                if (data.length > 0 && !currentPattern) {
                    setCurrentPattern(data[0]);

                    // Do NOT pre-fill codeMap. Let it fallback to active language.
                }
            } catch (err) {
                console.error("Failed to load patterns");
            }
        };
        fetchPatterns();
    }, []);

    // Handle Code Change for CURRENT pattern
    const handleCodeChange = (newCode) => {
        if (!currentPattern) return;
        setCodeMap(prev => ({
            ...prev,
            [currentPattern.id]: newCode
        }));
    };

    // Get current code or default
    const currentCode = currentPattern && codeMap[currentPattern.id]
        ? codeMap[currentPattern.id]
        : getDefaultCode(language);

    const [logs, setLogs] = useState([
        { time: new Date().toLocaleTimeString(), text: 'System Initialized...', type: 'system' },
        { time: new Date().toLocaleTimeString(), text: 'Press START SYSTEM to begin session...', type: 'info' }
    ]);

    const handleClearLogs = () => {
        setLogs([{ time: new Date().toLocaleTimeString(), text: 'Terminal Cleared', type: 'system' }]);
    };

    // Timer Logic & Disqualification
    useEffect(() => {
        let timer;
        if (isSessionActive && metrics.time > 0 && !isSuccess && !isDisqualified) {
            timer = setInterval(() => {
                setMetrics(prev => {
                    const newTime = Math.max(0, prev.time - 10);
                    if (newTime === 0) {
                        // Trigger Disqualification immediately
                        clearInterval(timer);
                    }
                    return { ...prev, time: newTime };
                });
            }, 10); // Update every 10ms for smooth millisecond display
        }
        return () => clearInterval(timer);
    }, [isSessionActive, metrics.time, isSuccess, isDisqualified]);

    // Separate Effect to handle Time Up
    useEffect(() => {
        if (isSessionActive && metrics.time === 0 && !isSuccess && !isDisqualified) {
            handleDisqualify();
        }
    }, [metrics.time, isSessionActive, isSuccess, isDisqualified]);

    const handleDisqualify = async () => {
        setIsSessionActive(false);
        setIsDisqualified(true);
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> TIME LIMIT EXCEEDED. SYSTEM HALTED. <<<', type: 'error' }]);

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/disqualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotNumber: userData.lotNo })
            });
        } catch (err) {
            console.error("Failed to disqualify user", err);
        }
    };

    const formatTime = (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const mili = Math.floor((ms % 1000) / 10);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${mili.toString().padStart(2, '0')}`;
    };

    // --- BACKEND SYNC LOGIC ---
    const handleStartSession = async () => {
        setIsSessionActive(true);
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '> SESSION STARTED. EDITOR UNLOCKED.', type: 'system' }]);

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotNumber: userData.lotNo,
                    lotNumber: userData.lotNo,
                    lotName: userData.lotName,
                    collegeName: userData.collegeName
                })
            });
        } catch (err) {
            console.error("Backend Sync Error:", err);
        }
    };

    // --- STATE REFS FOR INTERVAL ACCESS ---
    const stateRef = React.useRef({
        codeMap: {},
        metrics: { time: 3600000 },
        initialDuration: 3600000,
        completedPatterns: [],
        currentCode: '',
        currentPattern: null,
        attempts: 0,
        warningCount: 0
    });

    // Update Ref on every render/change
    useEffect(() => {
        stateRef.current = {
            codeMap,
            metrics,
            initialDuration,
            completedPatterns,
            currentCode,
            currentPattern,
            attempts,
            warningCount
        };
    }, [codeMap, metrics, initialDuration, completedPatterns, currentCode, currentPattern, attempts, warningCount]);

    // Helper: Calculate Totals
    const calculateTotalStats = (map) => {
        let totalLOC = 0;
        let totalLoops = 0;
        Object.values(map).forEach(code => {
            if (typeof code === 'string') {
                // Count LOC
                totalLOC += code.split('\n').filter(line => line.trim() !== '').length;
                // Count Loops
                const matches = code.match(/\b(for|while|do)\b/g);
                totalLoops += matches ? matches.length : 0;
            }
        });
        return { totalLOC, totalLoops };
    };

    // CORE SYNC FUNCTION
    const triggerSync = async (overrides = {}) => {
        if (!userData.lotNo) return;

        try {
            const currentState = stateRef.current;
            const activeCode = overrides.code || currentState.currentCode;
            const activeMap = overrides.codeMap || currentState.codeMap;
            const activeCompleted = overrides.completedPatterns || currentState.completedPatterns;

            // Ensure current code is in the map
            const cleanMap = { ...activeMap };
            if (currentState.currentPattern) {
                cleanMap[currentState.currentPattern.id] = activeCode;
            }

            const { totalLOC, totalLoops } = calculateTotalStats(cleanMap);
            const timeTaken = currentState.initialDuration - currentState.metrics.time;

            await fetch(`${import.meta.env.VITE_API_URL}/api/update-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotNumber: userData.lotNo,
                    code: activeCode,
                    codeMap: cleanMap,
                    totalTime: timeTaken,
                    linesOfCode: totalLOC,
                    noOfLoops: totalLoops,
                    attempts: 0,
                    warnings: currentState.warningCount,
                    patternsCompleted: activeCompleted.length
                })
            });
        } catch (err) { console.error("Sync failed", err); }
    };

    // 2. Periodic Progress Sync (Every 5 seconds)
    useEffect(() => {
        if (!isSessionActive || isSuccess) return;
        const interval = setInterval(() => triggerSync(), 5000);
        return () => clearInterval(interval);
    }, [isSessionActive, isSuccess]);

    const handleRun = async () => {
        if (isRunning || !isSessionActive) return;
        setIsRunning(true);
        setAttempts(prev => prev + 1);
        const currentAttempts = attempts + 1;

        const startTime = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time: startTime, text: `> Sending code to compiler (${language.toUpperCase()})...`, type: 'info' }]);

        try {
            const isC = language === 'c';
            // const runtime = isC ? { language: 'c', version: '10.2.0' } : { language: 'java', version: '15.0.2' };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    code: currentCode,
                    lotNumber: userData.lotNo
                })
            });

            const result = await response.json();
            setIsRunning(false);

            if (!response.ok) {
                // Handle Queue/Limit Errors
                const type = response.status === 429 ? 'warning' : 'error';
                const msg = result.message || 'Execution Failed';
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `> Server: ${msg}`, type }]);
                return;
            }

            if (result.run) {
                const output = result.run.stdout || result.run.stderr;
                const signal = result.run.signal;

                let displayOutput = output;
                let logType = result.run.stderr ? 'error' : 'output';

                if (signal) {
                    displayOutput = `>>> PROCESS TERMINATED: ${signal} (Likely Time/Memory Limit Exceeded) <<<`;
                    logType = 'error';
                }

                setLogs(prev => [...prev,
                { time: new Date().toLocaleTimeString(), text: '> Execution Complete.', type: 'system' },
                { time: '', text: 'Output:', type: 'system' },
                { time: '', text: displayOutput, type: logType }
                ]);

                // Pattern Matching Validation (Only if no signal and no stderr)
                if (!signal && !result.run.stderr && checkPatternMatch(output)) {
                    // Add to completed list
                    const newCompleted = [...completedPatterns];
                    let isNewCompletion = false;

                    if (!newCompleted.includes(currentPattern.id)) {
                        newCompleted.push(currentPattern.id);
                        setCompletedPatterns(newCompleted);
                        isNewCompletion = true;

                        // IMMEDIATE SYNC TO DB (Critical Fix)
                        triggerSync({ completedPatterns: newCompleted });

                        // Show immediate success message
                        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> PATTERN MATCHED! ACCESS GRANTED. <<<', type: 'success' }]);

                        // Show Level Success Overlay temporarily
                        setShowLevelSuccess(true);

                        // AUTO-ADVANCE LOGIC
                        if (newCompleted.length < allPatterns.length) {
                            setTimeout(() => {
                                setShowLevelSuccess(false);
                                const currentIndex = allPatterns.findIndex(p => p.id === currentPattern.id);
                                const nextIndex = (currentIndex + 1) % allPatterns.length;
                                setCurrentPattern(allPatterns[nextIndex]);
                            }, 2000); // 2s delay to see success
                        } else {
                            // If it was the last pattern, hide the level success overlay when the grand celebration starts
                            setTimeout(() => setShowLevelSuccess(false), 500);
                        }
                    } else {
                        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> ALREADY COMPLETED. MOVING... <<<', type: 'info' }]);
                    }

                    // Check if ALL patterns are done
                    // Note: checking newCompleted.length vs allPatterns.length
                    if (newCompleted.length === allPatterns.length) {
                        setIsSuccess(true);
                        setIsSessionActive(false);
                        // --- SYNC SUCCESS ---
                        const timeTaken = initialDuration - metrics.time;

                        // Prepare Final Stats
                        const finalMap = { ...codeMap, [currentPattern.id]: currentCode };
                        const { totalLOC, totalLoops } = calculateTotalStats(finalMap);

                        fetch(`${import.meta.env.VITE_API_URL}/api/finish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lotNumber: userData.lotNo,
                                totalTime: timeTaken,
                                linesOfCode: totalLOC,
                                noOfLoops: totalLoops,
                                attempts: currentAttempts,
                                warnings: warningCount,
                                codeMap: finalMap,
                                patternsCompleted: newCompleted.length
                            })
                        }).catch(console.error);
                    }

                } else {
                    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> PATTERN MISMATCH. ACCESS DENIED. <<<', type: 'error' }]);
                }

            } else {
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '> Error: Failed to execute.', type: 'error' }]);
            }

        } catch (error) {
            setIsRunning(false);
            setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `> Network Error: ${error.message}`, type: 'error' }]);
        }
    };

    const checkPatternMatch = (output) => {
        if (!currentPattern) return false;
        const normalize = (str) => {
            return str
                .replace(/\r\n/g, '\n')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '')
                .join('\n');
        };

        const cleanOutput = normalize(output);
        const cleanTarget = normalize(currentPattern.target_output);

        console.log("USER OUTPUT (Clean):\n", cleanOutput);
        console.log("TARGET (Clean):\n", cleanTarget);

        return cleanOutput === cleanTarget;
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        const codeForLang = getDefaultCode(lang);
        // Reset ALL patterns to this new language default? Or just current?
        // User asked for independent editors. 
        // Logic: When language changes, update CURRENT pattern code.
        handleCodeChange(codeForLang);
    };

    const [isFocused, setIsFocused] = useState(true);
    const [pasteError, setPasteError] = useState(false);

    const handlePasteError = () => {
        setPasteError(true);
        setWarningCount(prev => prev + 1); // Increment warning on paste violation
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> SYSTEM ALERT: UNAUTHORIZED PASTE ATTEMPT DETECTED. <<<', type: 'error' }]);
        setTimeout(() => setPasteError(false), 3000);
    };

    // Focus Security (Window Blur Detection)
    useEffect(() => {
        const handleFocusChange = () => {
            const focusSecurityEnabled = sessionStorage.getItem('FOCUS_SECURITY') === 'true';
            if (document.hidden && isSessionActive && !isSuccess && focusSecurityEnabled) {
                setIsFocused(false);
                setWarningCount(prev => prev + 1); // Increment warning on focus loss
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: '>>> SYSTEM ALERT: HOST WINDOW FOCUS LOST. VIOLATION RECORDED. <<<', type: 'error' }]);
            }
        };

        document.addEventListener('visibilitychange', handleFocusChange);
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`);
                const data = await res.json();
                sessionStorage.setItem('PASTE_SECURITY', data.PASTE_SECURITY);
                sessionStorage.setItem('FOCUS_SECURITY', data.FOCUS_SECURITY);

                // SYNC TIME LIVE BEFORE START
                if (!isSessionActive) {
                    let durationMs = null;
                    if (data.SESSION_DURATION_MS) durationMs = parseInt(data.SESSION_DURATION_MS);
                    else if (data.SESSION_DURATION_MINUTES) durationMs = parseInt(data.SESSION_DURATION_MINUTES) * 60 * 1000;

                    if (durationMs && !isNaN(durationMs)) {
                        setMetrics(prev => {
                            if (prev.time !== durationMs) return { ...prev, time: durationMs };
                            return prev;
                        });
                    }
                }
            } catch (err) { }
        }, 2000); // Check every 2 seconds for faster updates

        // Initial Settings Fetch including Duration
        const fetchInitialSettings = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`);
                const data = await res.json();
                console.log("FETCHED SETTINGS:", data); // Debugging

                sessionStorage.setItem('PASTE_SECURITY', data.PASTE_SECURITY);
                sessionStorage.setItem('FOCUS_SECURITY', data.FOCUS_SECURITY);

                // Robust Duration Parsing
                let durationMs = null;
                if (data.SESSION_DURATION_MS) {
                    durationMs = parseInt(data.SESSION_DURATION_MS);
                } else if (data.SESSION_DURATION_MINUTES) {
                    durationMs = parseInt(data.SESSION_DURATION_MINUTES) * 60 * 1000;
                }

                if (durationMs && !isNaN(durationMs)) {
                    console.log("SETTING DURATION TO:", durationMs);
                    if (!isSessionActive) {
                        setMetrics(prev => ({ ...prev, time: durationMs }));
                        setInitialDuration(durationMs);
                    }
                }
            } catch (err) { console.error("Error fetching settings:", err); }
        };
        fetchInitialSettings();

        return () => {
            document.removeEventListener('visibilitychange', handleFocusChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            clearInterval(interval);
        };
    }, [isSessionActive, isSuccess]);

    const handleResume = () => {
        setIsFocused(true);
    };

    // --- RESIZABLE TERMINAL LOGIC ---
    const [terminalHeight, setTerminalHeight] = useState(180); // Default 180px
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = React.useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            // Calculate new height from bottom
            const newHeight = window.innerHeight - mouseMoveEvent.clientY;
            if (newHeight > 50 && newHeight < window.innerHeight - 100) {
                setTerminalHeight(newHeight);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);


    return (
        <div className="editor-layout" style={{
            height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
            background: '#0e1015', color: '#e0e0e0', fontFamily: 'Inter, sans-serif', position: 'relative',
            userSelect: isResizing ? 'none' : 'auto' // Prevent text selection while resizing
        }}>
            {/* Security Overlay */}
            {!isFocused && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999,
                    background: 'rgba(255, 0, 0, 0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', backdropFilter: 'blur(10px)'
                }}>
                    <h1 style={{ fontSize: '3rem', fontFamily: 'Orbitron', marginBottom: '20px', textShadow: '0 0 20px black' }}>⚠️ SECURITY ALERT ⚠️</h1>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace' }}>FOCUS LOST - POTENTIAL VIOLATION</h2>
                    <p style={{ fontSize: '1.2rem', maxWidth: '600px', textAlign: 'center', margin: '20px 0' }}>Multiple window switches may result in disqualification. Please stay in the editor environment.</p>
                    <button onClick={handleResume} style={{ padding: '15px 40px', fontSize: '1.5rem', background: 'black', color: 'red', border: '2px solid white', cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 'bold', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>RETURN TO SESSION</button>
                </div>
            )}

            {/* Top Navigation Bar */}
            <div className="top-nav" style={{
                height: '50px', background: '#1a1d26', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', position: 'relative', flexShrink: 0
            }}>
                {/* ... (Same Top Nav content) ... */}

                {/* Left: Brand & File Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div className="brand" style={{
                        fontFamily: 'Orbitron',
                        color: typeof isSessionActive !== 'undefined' && !isSessionActive ? '#555' : '#00ffff',
                        fontWeight: 'bold', fontSize: '1.2rem', textShadow: isSessionActive ? '0 0 10px rgba(0, 255, 255, 0.6)' : 'none', transition: 'color 0.3s'
                    }}>
                        QMAZE_IDE_v2.0
                    </div>
                </div>

                {/* Center: Language & Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <select value={language} onChange={handleLanguageChange} disabled={isSessionActive} style={{
                        background: '#000', color: isSessionActive ? '#777' : '#00ff41', border: '2px solid #00ff41', padding: '6px 15px', borderRadius: '4px', fontFamily: 'Orbitron, sans-serif', outline: 'none', cursor: isSessionActive ? 'not-allowed' : 'pointer', opacity: isSessionActive ? 0.6 : 1,
                        boxShadow: '0 0 15px rgba(0, 255, 65, 0.4)', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.3s'
                    }}>
                        <option value="c">C (GCC 10.2)</option>
                        <option value="java">Java (OpenJDK 15)</option>
                    </select>

                    {!isSessionActive ? (
                        isSuccess ? (
                            <button style={{
                                background: '#00ff00', border: 'none', padding: '8px 30px', color: '#000', fontWeight: 'bold', fontFamily: 'Orbitron', cursor: 'default', borderRadius: '2px', boxShadow: '0 0 15px rgba(0, 255, 0, 0.6)', fontSize: '0.9rem', opacity: 1
                            }}>SYSTEM MATCHED</button>
                        ) : (
                            <button onClick={handleStartSession} style={{
                                background: '#00ccff', border: 'none', padding: '8px 30px', color: '#000', fontWeight: 'bold', fontFamily: 'Orbitron', cursor: 'pointer', borderRadius: '2px', boxShadow: '0 0 15px rgba(0, 204, 255, 0.6)', animation: 'pulse 1.5s infinite', fontSize: '0.9rem'
                            }}>START SYSTEM</button>
                        )
                    ) : (
                        completedPatterns.includes(currentPattern?.id) ? (
                            <span style={{ color: '#00ff41', fontFamily: 'Orbitron', fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,255,65,0.5)' }}>
                                [ PATTERN SECURED ]
                            </span>
                        ) : (
                            <button onClick={handleRun} disabled={isRunning || isSuccess} style={{
                                background: isSuccess ? '#00ff00' : (isRunning ? '#444' : '#00cc00'), border: 'none', padding: '8px 25px', color: isSuccess ? '#000' : '#fff', fontWeight: 'bold', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '8px', cursor: (isRunning || isSuccess) ? 'default' : 'pointer', borderRadius: '2px', boxShadow: isRunning ? 'none' : '0 0 15px rgba(0, 204, 0, 0.6)', textShadow: '0 0 5px black'
                            }}>{isSuccess ? 'MATCHED!' : (isRunning ? 'EXECUTING...' : 'RUN_CODE')}</button>
                        )
                    )}
                </div>

                {/* Right: Timer & User Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div className="timer" style={{
                        fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', color: isSuccess ? '#00ff00' : '#ff0055', background: 'rgba(0,0,0,0.5)', padding: '0px 15px', borderRadius: '4px', border: `2px solid ${isSuccess ? '#00ff00' : '#ff0055'}`, boxShadow: `0 0 15px ${isSuccess ? '#00ff00' : '#ff0055'}`, textShadow: `0 0 10px ${isSuccess ? '#00ff00' : '#ff0055'}`, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', letterSpacing: '2px', minWidth: '220px', justifyContent: 'center'
                    }}>
                        <span>{formatTime(metrics.time)}</span>
                    </div>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', height: '100%' }}>
                    {/* Institute Profile Block */}
                    {userData.collegeName && (
                        <div className="institute-profile" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                            fontFamily: 'Consolas', fontSize: '0.8rem', lineHeight: '1.4',
                            borderRight: '1px solid #333', paddingRight: '15px', height: '70%', justifyContent: 'center'
                        }}>
                            <div style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '1px' }}>INSTITUTE</div>
                            <div style={{
                                color: '#00ccff', fontWeight: 'bold', fontSize: '0.9rem',
                                maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                textShadow: '0 0 5px rgba(0, 204, 255, 0.4)'
                            }}>
                                {userData.collegeName}
                            </div>
                        </div>
                    )}

                    {/* User Profile Block */}
                    <div className="user-profile" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                        fontFamily: 'Consolas', fontSize: '0.8rem', lineHeight: '1.4',
                        height: '70%', justifyContent: 'center'
                    }}>
                        <div style={{ color: '#666', fontSize: '0.7rem', letterSpacing: '1px' }}>SESSION_USER</div>
                        <div style={{ color: '#ff00ff', fontWeight: 'bold', fontSize: '1rem', textShadow: '0 0 5px rgba(255, 0, 255, 0.4)' }}>
                            {userData.lotName || 'GUEST'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Workspace Split */}
            <div className="workspace-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1e1e' }}>
                <div className="upper-pane" style={{ flex: 1, display: 'flex', minHeight: '0' }}> {/* flex 1 auto-grows to take available space */}
                    {/* LEFT COLUMN: Editor + Tabs */}
                    <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* TAB BAR */}
                        <div style={{ display: 'flex', background: '#151515', borderBottom: '1px solid #333', overflowX: 'auto', flexShrink: 0 }}>
                            {allPatterns.map((p, index) => {
                                const isLocked = index > completedPatterns.length;
                                const isCompleted = completedPatterns.includes(p.id);
                                return (
                                    <div key={p.id}
                                        onClick={() => !isLocked && setCurrentPattern(p)}
                                        style={{
                                            padding: '8px 15px',
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                            background: currentPattern?.id === p.id ? '#1e1e1e' : '#111',
                                            color: isLocked ? '#444' : (currentPattern?.id === p.id ? '#fff' : '#888'),
                                            borderTop: currentPattern?.id === p.id ? '2px solid #00ff41' : '2px solid transparent',
                                            borderRight: '1px solid #333',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            whiteSpace: 'nowrap',
                                            opacity: isLocked ? 0.5 : 1
                                        }}>
                                        <span>{p.name}</span>
                                        {isCompleted && <span style={{ color: '#00ff41' }}>✔</span>}
                                        {isLocked && <span style={{ fontSize: '0.8rem' }}>🔒</span>}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <CodeEditor
                                key={currentPattern?.id}
                                code={currentCode}
                                onChange={handleCodeChange}
                                language={language}
                                readOnly={!isSessionActive || isSuccess || completedPatterns.includes(currentPattern?.id)}
                                onPasteError={handlePasteError}
                            />

                            {/* LOCKED / COMPLETED SHIELD OVERLAY */}
                            {(completedPatterns.includes(currentPattern?.id) && !isSuccess) && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'rgba(0, 20, 0, 0.4)',
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center',
                                    zIndex: 15,
                                    border: '1px solid #00ff41',
                                    backdropFilter: 'grayscale(100%) blur(2px)'
                                }}>
                                    <div style={{ fontSize: '3rem', color: '#00ff41', marginBottom: '10px' }}>🔒</div>
                                    <div style={{ color: '#00ff41', fontFamily: 'Orbitron', fontSize: '1.5rem', letterSpacing: '2px', background: 'black', padding: '10px 20px', border: '1px solid #00ff41' }}>
                                        PATTERN LOCKED
                                    </div>
                                    <div style={{ color: '#aaa', marginTop: '10px', fontFamily: 'Mono' }}>Read-Only Mode</div>
                                </div>
                            )}

                            {/* LEVEL SUCCESS OVERLAY (Temporary) */}
                            {showLevelSuccess && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'rgba(0,0,0,0.85)',
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center',
                                    zIndex: 25
                                }}>
                                    <h1 style={{ color: '#00ff00', fontFamily: 'Orbitron', fontSize: '3rem', animation: 'pulse 0.5s infinite alternate' }}>PATTERN MATCHED</h1>
                                    <h2 style={{ color: '#fff', marginTop: '10px' }}>ACCESS GRANTED &gt;&gt;</h2>
                                </div>
                            )}

                            {/* SYSTEM LOCKED OVERLAY: Only show if session is NOT active AND NOT success AND NOT disqualified */}
                            {!isSessionActive && !isSuccess && !isDisqualified && (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00ffff', fontFamily: 'Orbitron', letterSpacing: '2px', zIndex: 10 }}>
                                    SYSTEM LOCKED
                                </div>
                            )}

                            {/* DISQUALIFIED OVERLAY */}
                            {isDisqualified && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'rgba(20, 0, 0, 0.95)',
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center',
                                    zIndex: 100,
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    <h1 style={{
                                        color: '#ff0000', fontFamily: 'Orbitron', fontSize: '4rem',
                                        textShadow: '0 0 20px red', marginBottom: '20px',
                                        animation: 'pulse 1s infinite'
                                    }}>TIME'S UP</h1>
                                    <h2 style={{ color: '#fff', fontFamily: 'monospace', fontSize: '2rem' }}>SYSTEM DISCONNECTED</h2>
                                    <div style={{ marginTop: '30px', border: '1px solid red', padding: '15px 30px', color: 'red' }}>
                                        SESSION TERMINATED DUE TO TIMEOUT
                                    </div>
                                </div>
                            )}
                            {/* SUCCESS OVERLAY */}
                            {isSuccess && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: '#000',
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center',
                                    zIndex: 20,
                                    overflow: 'hidden',
                                    perspective: '1000px'
                                }}>
                                    {/* 3D Grid Background */}
                                    <div className="cyber-grid" style={{
                                        position: 'absolute', width: '200%', height: '200%',
                                        background: `
                                            linear-gradient(transparent 0%, rgba(0, 255, 65, 0.2) 2%, transparent 5%),
                                            linear-gradient(90deg, transparent 0%, rgba(0, 255, 65, 0.2) 2%, transparent 5%)
                                        `,
                                        backgroundSize: '80px 80px',
                                        transform: 'rotateX(60deg) translateY(-100px) translateZ(-200px)',
                                        animation: 'gridMove 10s linear infinite',
                                        opacity: 0.4
                                    }}></div>

                                    {/* CSS Fireworks Container */}
                                    <div className="pyro">
                                        <div className="before"></div>
                                        <div className="after"></div>
                                    </div>

                                    {/* Main Glitch Text */}
                                    <h1 className="glitch-text" data-text="MISSION ACCOMPLISHED" style={{
                                        fontSize: '5rem', color: '#00ff41', fontFamily: 'Orbitron', fontWeight: '900',
                                        textTransform: 'uppercase', position: 'relative', zIndex: 10,
                                        letterSpacing: '5px',
                                        textShadow: '0 0 30px #00ff41'
                                    }}>
                                        MISSION ACCOMPLISHED
                                    </h1>

                                    <div style={{
                                        marginTop: '40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '20px',
                                        zIndex: 10
                                    }}>
                                        <div style={{
                                            border: '2px solid #00ff41',
                                            padding: '20px 50px',
                                            fontSize: '1.5rem',
                                            fontFamily: 'Orbitron',
                                            color: 'white',
                                            background: 'rgba(0,0,0,0.7)',
                                            boxShadow: '0 0 20px rgba(0,255,65,0.4)',
                                            animation: 'pulse 2s infinite'
                                        }}>
                                            ALL PATTERNS MATCHED
                                        </div>
                                        <div style={{ fontSize: '1.2rem', color: '#00ccff', fontFamily: 'Consolas' }}>
                                            SESSION TERMINATED SUCCESSFULLY
                                        </div>
                                    </div>

                                    {/* Rotating Ring */}
                                    <div style={{
                                        position: 'absolute', width: '800px', height: '800px',
                                        border: '4px dashed rgba(0,255,65,0.5)', borderRadius: '50%',
                                        animation: 'spin 30s linear infinite'
                                    }}></div>
                                    <div style={{
                                        position: 'absolute', width: '650px', height: '650px',
                                        border: '6px solid rgba(0,255,65,0.2)', borderRadius: '50%',
                                        borderLeftColor: 'transparent',
                                        borderRightColor: 'transparent',
                                        animation: 'spin 20s linear infinite reverse'
                                    }}></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PATTERN VIEW */}
                    <div style={{ width: '40%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <PatternView pattern={currentPattern ? currentPattern.target_output : "LOADING..."} levelName={currentPattern ? currentPattern.name : ""} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lower Terminal */}
            {/* Lower Terminal - HIDDEN ON SUCCESS */}
            {
                !isSuccess && (
                    <>
                        {/* DRAG HANDLE */}
                        <div
                            onMouseDown={startResizing}
                            style={{
                                height: '5px',
                                background: isResizing ? '#00ffff' : '#333',
                                cursor: 'ns-resize',
                                transition: 'background 0.2s',
                                zIndex: 100
                            }}
                        />

                        <div className="lower-pane" style={{ height: `${terminalHeight}px`, flexShrink: 0, position: 'relative' }}>
                            <div style={{ height: '100%', flexShrink: 0, borderTop: '2px solid #00ffff' }}>
                                <Terminal logs={logs} onClear={handleClearLogs} />
                            </div>
                            {/* NOTE BELOW TERMINAL */}
                            <div style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '10px',
                                color: '#ffaa00',
                                fontSize: '0.8rem',
                                fontFamily: 'Consolas',
                                background: 'rgba(0,0,0,0.8)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #ffaa00'
                            }}>
                                Note: After selecting a programming language, all patterns must be done in the same language.
                            </div>
                        </div>
                    </>
                )
            }

            <style>{`
                /* 3D Grid Animation */
                @keyframes gridMove {
                    0% { transform: rotateX(60deg) translateY(0) translateZ(-200px); }
                    100% { transform: rotateX(60deg) translateY(50px) translateZ(-200px); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes scanline {
                    0% { top: -100%; }
                    100% { top: 100%; }
                }

                /* Glitch Text Effect */
                .glitch-text {
                    position: relative;
                }
                .glitch-text::before, .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                }
                .glitch-text::before {
                    left: 2px;
                    text-shadow: -1px 0 #ff00c1;
                    clip-path: inset(44% 0 61% 0);
                    animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
                }
                .glitch-text::after {
                    left: -2px;
                    text-shadow: -1px 0 #00fff9;
                    clip-path: inset(54% 0 12% 0);
                    animation: glitch-anim-2 3s infinite linear alternate-reverse;
                }

                @keyframes glitch-anim-1 {
                    0% { clip-path: inset(20% 0 80% 0); }
                    20% { clip-path: inset(60% 0 10% 0); }
                    40% { clip-path: inset(40% 0 50% 0); }
                    60% { clip-path: inset(80% 0 5% 0); }
                    80% { clip-path: inset(10% 0 70% 0); }
                    100% { clip-path: inset(30% 0 20% 0); }
                }
                @keyframes glitch-anim-2 {
                    0% { clip-path: inset(15% 0 40% 0); }
                    20% { clip-path: inset(70% 0 10% 0); }
                    40% { clip-path: inset(20% 0 30% 0); }
                    60% { clip-path: inset(10% 0 80% 0); }
                    80% { clip-path: inset(50% 0 10% 0); }
                    100% { clip-path: inset(40% 0 60% 0); }
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 204, 255, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 204, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 204, 255, 0); }
                }

                /* FIREWORKS CSS */
                .pyro > .before, .pyro > .after {
                  position: absolute;
                  width: 5px;
                  height: 5px;
                  border-radius: 50%;
                  box-shadow: -120px -218.66667px blue, 248px -16.66667px #00ff84, 190px 16.66667px #002bff, -113px -308.66667px #ff009d, -109px -287.66667px #ffb300, -50px -313.66667px #ff006e, 226px -31.66667px #ff006e, 180px -351.66667px #ff006e, 250px -351.66667px #ff006e, 190px -69.66667px #ff006e, -20px 4.33333px #ff006e, -50px -208.66667px #ff006e, 350px -100.33333px #ff006e, 300px -250.66667px #ff006e, 20px -200.66667px #ff006e;
                  animation: 1s bang ease-out infinite backwards, 1s gravity ease-in infinite backwards, 5s position linear infinite backwards;
                }
                .pyro > .after {
                  animation-delay: 1.25s, 1.25s, 1.25s;
                  animation-duration: 1.25s, 1.25s, 6.25s;
                }
                @keyframes bang {
                  to {
                    box-shadow: -200px -318.66667px transparent, 100px -116.66667px transparent, 120px 16.66667px transparent, -213px -408.66667px transparent, -159px -387.66667px transparent, -250px -413.66667px transparent, 126px -131.66667px transparent, 80px -451.66667px transparent, 150px -451.66667px transparent, 90px -169.66667px transparent, -120px -95.66667px transparent, -150px -308.66667px transparent, 250px -200.33333px transparent, 200px -350.66667px transparent, -80px -300.66667px transparent;
                  }
                }
                @keyframes gravity {
                  to {
                    transform: translateY(200px);
                    opacity: 0;
                  }
                }
                @keyframes position {
                  0%, 19.9% { margin-top: 10%; margin-left: 40%; }
                  20%, 39.9% { margin-top: 40%; margin-left: 30%; }
                  40%, 59.9% { margin-top: 20%; margin-left: 70%; }
                  60%, 79.9% { margin-top: 30%; margin-left: 20%; }
                  80%, 99.9% { margin-top: 30%; margin-left: 80%; }
                }
            `}</style>
        </div >
    );
};
export default EditorLayout;
