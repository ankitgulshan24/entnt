import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('talentflow_user');
    const savedUserType = localStorage.getItem('talentflow_userType');
    const savedAppliedJobs = localStorage.getItem('talentflow_appliedJobs');
    
    if (savedUser && savedUserType) {
      try {
        setUser(JSON.parse(savedUser));
        setUserType(savedUserType);
        if (savedAppliedJobs) {
          setAppliedJobs(new Set(JSON.parse(savedAppliedJobs)));
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('talentflow_user');
        localStorage.removeItem('talentflow_userType');
        localStorage.removeItem('talentflow_appliedJobs');
      }
    }
  }, []);

  const login = (userData, type) => {
    const userInfo = {
      id: userData.id || `user-${Date.now()}`,
      name: userData.name || (type === 'hr' ? 'HR Manager' : 'Candidate'),
      email: userData.email || `${type}@talentflow.com`,
      avatar: userData.avatar || null,
      role: type,
      loginTime: new Date().toISOString()
    };

    setUser(userInfo);
    setUserType(type);
    
    // Save to localStorage
    localStorage.setItem('talentflow_user', JSON.stringify(userInfo));
    localStorage.setItem('talentflow_userType', type);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setAppliedJobs(new Set());
    localStorage.removeItem('talentflow_user');
    localStorage.removeItem('talentflow_userType');
    localStorage.removeItem('talentflow_appliedJobs');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('talentflow_user', JSON.stringify(updatedUser));
  };

  const addAppliedJob = (jobId) => {
    const newAppliedJobs = new Set([...appliedJobs, jobId]);
    setAppliedJobs(newAppliedJobs);
    localStorage.setItem('talentflow_appliedJobs', JSON.stringify([...newAppliedJobs]));
  };

  const hasAppliedToJob = (jobId) => {
    return appliedJobs.has(jobId);
  };

  const value = {
    user,
    userType,
    login,
    logout,
    updateUser,
    addAppliedJob,
    hasAppliedToJob,
    appliedJobs: [...appliedJobs],
    isAuthenticated: !!user && !!userType
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
