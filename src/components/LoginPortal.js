import React, { useState } from 'react';
import './LoginPortal.css';

const LoginPortal = ({ onLogin }) => {
  const [userData, setUserData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = () => {
    if (userData.name && userData.email) {
      onLogin('hr', userData);
    }
  };

  return (
    <div className="login-portal">
      <div className="login-container">
        <div className="login-header">
          <h1>TalentFlow</h1>
          <p>HR Management System</p>
        </div>
        
        <div className="login-form-container">
          <h2>Welcome to TalentFlow</h2>
          <p>HR Management Dashboard</p>
          
          <div className="user-details-form">
            <h3>Login:</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="form-control"
              />
            </div>
            <button 
              type="button"
              className="btn btn-primary login-btn"
              onClick={handleLogin}
              disabled={!userData.name || !userData.email}
            >
              Access HR Dashboard
            </button>
          </div>
        </div>
        
        <div className="login-footer">
          <p>Access the HR Management Dashboard</p>
          <div className="sample-credentials">
            <h4>Sample Credentials:</h4>
            <div className="credentials-list">
              <div className="credential-item">
                <strong>HR Manager:</strong> sarah.johnson@company.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;

