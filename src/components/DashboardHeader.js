import React from 'react';
import { useUser } from '../contexts/UserContext';
import './DashboardHeader.css';

const DashboardHeader = ({ onLogout }) => {
  const { user, userType } = useUser();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'hr':
        return 'HR Manager';
      case 'candidate':
        return 'Candidate';
      default:
        return 'User';
    }
  };

  const getDashboardTitle = (role) => {
    switch (role) {
      case 'hr':
        return 'HR Dashboard';
      case 'candidate':
        return 'Candidate Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L20 12H30L22 20L26 30L16 24L6 30L10 20L2 12H12L16 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="brand-info">
              <h1 className="brand-title">TalentFlow</h1>
              <span className="dashboard-subtitle">{getDashboardTitle(userType)}</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span className="avatar-initials">{getInitials(user?.name)}</span>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-role">{getRoleDisplayName(userType)}</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                onClick={onLogout} 
                className="logout-btn"
                title="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 7L7 17M7 7L17 17M7 7H17M7 17H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
