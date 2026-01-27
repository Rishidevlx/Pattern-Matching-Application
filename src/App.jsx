import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import EditorLayout from './components/Editor/EditorLayout';

function App() {
  const [view, setView] = useState('landing'); // landing, login, editor
  const [userData, setUserData] = useState({ lotNo: '', lotName: '', collegeName: '' });

  const handleStart = () => {
    setView('login');
  };

  const handleLogin = (lotNo, lotName, collegeName) => {
    setUserData({ lotNo, lotName, collegeName });
    setView('editor');
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
        <EditorLayout userData={userData} />
      )}
    </div>
  );
}

export default App;
