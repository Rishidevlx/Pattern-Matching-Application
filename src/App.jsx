import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import EditorLayout from './components/Editor/EditorLayout';

function App() {
  const [view, setView] = useState('landing'); // landing, login, editor
  const [userData, setUserData] = useState({ lotNo: '', lotName: '', collegeName: '' });

  // Auto-login check (Updated: Still fetches data but stays on landing page)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem('qmaze_user_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.lotNo) {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me/${parsed.lotNo}`);
            const data = await res.json();

            if (data.success && data.user) {
              setUserData({
                lotNo: data.user.lot_number,
                lotName: data.user.lot_name,
                collegeName: data.user.college_name || '',
                dbStartTime: data.user.start_time,
                dbPatternsCompleted: data.user.patterns_completed,
                dbStatus: data.user.status,
                dbCodeData: data.user.code_data
              });
              // Removed auto setView('editor') to force re-login/re-entry flow
            }
          }
        }
      } catch (err) {
        console.error('Error verifying session data', err);
      }
    };
    checkSession();
  }, []);

  const handleStart = () => {
    setView('login');
  };

  const handleLogin = async (lotNo, lotName, collegeName) => {
    try {
      // Just in case it's a first time login or a resume, ask the backend first
      const initRes = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotNumber: lotNo, lotName, collegeName })
      });
      const initData = await initRes.json();

      if (initData.success && initData.user) {
        setUserData({
          lotNo: initData.user.lot_number,
          lotName: initData.user.lot_name,
          collegeName: initData.user.college_name || '',
          dbStartTime: initData.user.start_time,
          dbPatternsCompleted: initData.user.patterns_completed,
          dbStatus: initData.user.status,
          dbCodeData: initData.user.code_data
        });
        setView('editor');
      } else {
        // Fallback to basic if backend fails (unlikely)
        setUserData({ lotNo, lotName, collegeName });
        setView('editor');
      }
    } catch (err) {
      console.error("Login sync failed", err);
      setUserData({ lotNo, lotName, collegeName });
      setView('editor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qmaze_user_session');
    setUserData({ lotNo: '', lotName: '', collegeName: '' });
    setView('landing');
  };

  return (
    <div className="app-container">
      {view === 'landing' && <LandingPage onStart={handleStart} />}
      {view === 'login' && (
        <React.Fragment>
          {/* Keep LandingPage in background but maybe blur it or restart animation? 
              For now just render it underneath for visual consistency if overlay covers it.
              But LoginModal handles its own overlay. */}
          <LandingPage onStart={() => { }} />
          <LoginModal onLogin={handleLogin} onBack={() => setView('landing')} />
        </React.Fragment>
      )}
      {view === 'editor' && (
        <EditorLayout userData={userData} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
