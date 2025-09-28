import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPortal from './components/LoginPortal';
import HRDashboard from './components/HRDashboard';
import JobDetail from './components/JobDetail';
import AssessmentBuilder from './components/AssessmentBuilder';
import CandidateProfile from './components/CandidateProfile';
import { UserProvider, useUser } from './contexts/UserContext';
import { initializeDB } from './utils/database';
// ❌ REMOVE static MSW import
// import { initializeMSW } from './mocks/browser';
import { setApiReady } from './utils/apiReady';

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');

        // Dev-only MSW via dynamic import (prevents prod side-effects/bundling)
        const isDev =
          (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') ||
          process.env.NODE_ENV === 'development';

        if (isDev) {
          console.log('Initializing MSW (dev only)…');
          try {
            const { initializeMSW } = await import('./mocks/browser');
            await initializeMSW();
            console.log('MSW initialized successfully');
          } catch (e) {
            console.warn('MSW init skipped/failed in dev:', e);
          }
        } else {
          console.log('Skipping MSW in production');
        }

        // tiny pause (optional)
        await new Promise((r) => setTimeout(r, 200));

        console.log('Initializing database...');
        await initializeDB();
        console.log('Database initialized successfully');

        await new Promise((r) => setTimeout(r, 200));

        setApiReady(true);
        console.log('App initialization completed successfully - API is ready');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setTimeout(() => {
          setApiReady(true);
          console.log('API marked as ready after initialization error');
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (_type, userData = {}) => {
    login(userData, 'hr');
    navigate('/hr');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center mt-4">
          <div
            className="loading-spinner"
            style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px auto',
            }}
          />
          <h2>Loading TalentFlow...</h2>
          <p>Initializing database and API services...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPortal onLogin={handleLogin} />} />

        <Route
          path="/hr"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <HRDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:jobId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <JobDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assessments/:jobId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AssessmentBuilder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidates/:candidateId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <CandidateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/hr' : '/login'} replace />}
        />

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/hr' : '/login'} replace />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
