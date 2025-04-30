import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Studio from './pages/Studio';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Error from './pages/Error';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialization logic here (load user settings, check auth, etc.)
    const initApp = async () => {
      // Simulate loading resources
      await new Promise(resolve => setTimeout(resolve, 500));
      setInitialized(true);
    };
    
    initApp();
  }, []);

  if (!initialized) {
    return (
      <div className="app-loader">
        <div className="loader-content">
          <div className="loader-icon">
            <i className="fas fa-brain"></i>
          </div>
          <h1>AI Studio</h1>
          <div className="loading-indicator">
            <div className="loading-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/auth/*" element={<Auth />} />
            <Route path="/" element={
              <>
                <TopBar />
                <Dashboard />
              </>
            } />
            <Route path="/studio/:projectId" element={
              <>
                <TopBar />
                <Studio />
              </>
            } />
            <Route path="/settings" element={
              <>
                <TopBar />
                <Settings />
              </>
            } />
            <Route path="*" element={<Error />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;