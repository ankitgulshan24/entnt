import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPortal from './components/LoginPortal';
import HRDashboard from './components/HRDashboard';
import JobDetail from './components/JobDetail';
import AssessmentBuilder from './components/AssessmentBuilder';
import CandidateProfile from './components/CandidateProfile';
import { UserProvider, useUser } from './contexts/UserContext';
import { initializeDB } from './utils/database';
import { initializeMSW } from './mocks/browser';
import { setApiReady } from './utils/apiReady';

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
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
        
        // Initialize MSW for API mocking
        console.log('Initializing MSW...');
        await initializeMSW();
        console.log('MSW initialized successfully');
        
        // Wait a bit more to ensure MSW is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize IndexedDB
        console.log('Initializing database...');
        await initializeDB();
        console.log('Database initialized successfully');
        
        // Wait a bit more to ensure DB is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mark API as ready
        setApiReady(true);
        console.log('App initialization completed successfully - API is ready');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Even if initialization fails, mark API as ready after a delay
        setTimeout(() => {
          setApiReady(true);
          console.log('API marked as ready after initialization error');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (type, userData = {}) => {
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
          <div className="loading-spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
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
        <Route
          path="/login"
          element={<LoginPortal onLogin={handleLogin} />}
        />

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
          element={
            isAuthenticated ? (
              <Navigate to="/hr" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/hr' : '/login'} replace />
          }
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
