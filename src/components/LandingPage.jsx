import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import BackgroundEffect from './BackgroundEffect';

const LandingPage = ({ onStart }) => {
    const [glitch, setGlitch] = useState(false);
    const [displayText, setDisplayText] = useState('START_SYSTEM');
    const originalText = 'START_SYSTEM';
    const containerRef = useRef(null);

    // Parallax Tilt State
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 200);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const { width, height, left, top } = containerRef.current.getBoundingClientRect();
        const x = e.clientX - left - width / 2;
        const y = e.clientY - top - height / 2;

        // Calculate tilt (limit to +/- 20deg)
        setOffset({
            x: (x / width) * 20,
            y: (y / height) * 20
        });
    };

    const handleButtonHover = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayText(prev =>
                prev.split('').map((letter, index) => {
                    if (index < iterations) return originalText[index];
                    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"[Math.floor(Math.random() * 26)];
                }).join('')
            );
            if (iterations >= originalText.length) clearInterval(interval);
            iterations += 1 / 2;
        }, 30);
    };

    const handleButtonLeave = () => {
        setDisplayText(originalText);
    };

    return (
        <div className="landing-container" onMouseMove={handleMouseMove}>
            <BackgroundEffect />
            <div className="overlay"></div>

            <header className="landing-header">
                <h3 className="dept-name">DEPARTMENT OF COMPUTER APPLICATIONS</h3>
                <h4 className="college-name">AYYA NADAR JANAKI AMMAL COLLEGE (Autonomous)</h4>
            </header>

            <div
                ref={containerRef}
                className="tilt-wrapper"
                style={{
                    transform: `perspective(1000px) rotateX(${offset.y * -1}deg) rotateY(${offset.x}deg)`
                }}
            >
                <main className="landing-main">
                    <h1 className={`qumaze-title ${glitch ? 'glitching' : ''}`} data-text="QMAZE 2K26">
                        QMAZE 2K26
                    </h1>
                </main>
            </div>

            <h2 className="event-subtitle">PATTERN MATCHING</h2>

            <button
                className="start-btn"
                onClick={onStart}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
            >
                <span className="btn-bracket">[</span>
                <span className="btn-text">{displayText}</span>
                <span className="btn-bracket">]</span>
            </button>
        </div>
    );
};

export default LandingPage;
