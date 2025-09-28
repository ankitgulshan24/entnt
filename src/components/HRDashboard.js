import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import JobsBoard from './JobsBoard';
import CandidatesKanban from './CandidatesKanban';
// import CandidatesList from './CandidatesList';
import ApplicationStats from './ApplicationStats';
import DashboardHeader from './DashboardHeader';
import './Dashboard.css';

const HRDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('stats');

  const tabs = [
    { id: 'stats', label: 'Application Stats', component: ApplicationStats },
    { id: 'jobs', label: 'Jobs Management', component: JobsBoard },
    { id: 'kanban', label: 'Pipeline', component: CandidatesKanban }
    // { id: 'candidates', label: 'Candidates List', component: CandidatesList }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="dashboard">
      <DashboardHeader onLogout={onLogout} />
      
      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-content">
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="tab-content">
              <Routes>
                <Route path="/" element={ActiveComponent && <ActiveComponent />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;
