import React, { useState, useEffect } from 'react';
import { getApplications, getJobApplications } from '../services/applicationsApi';
import { retryApiCall, waitForApiReady } from '../utils/apiReady';
import './ApplicationStats.css';

const ApplicationStats = ({ jobId = null }) => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    todayApplications: 0,
    thisWeekApplications: 0,
    thisMonthApplications: 0,
    recentApplications: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Wait for API to be ready
      await waitForApiReady(5000);
      
      // Get applications - either all or job-specific with retry
      const applications = jobId 
        ? await retryApiCall(() => getJobApplications(jobId))
        : await retryApiCall(() => getApplications());
      
      // Ensure applications is an array
      if (!Array.isArray(applications)) {
        console.error('Applications is not an array:', applications);
        setError('Failed to load applications data');
        return;
      }
      
      // Process applications data
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const todayApplications = applications.filter(app => 
        app && app.appliedAt && new Date(app.appliedAt) >= today
      ).length;
      
      const thisWeekApplications = applications.filter(app => 
        app && app.appliedAt && new Date(app.appliedAt) >= weekAgo
      ).length;
      
      const thisMonthApplications = applications.filter(app => 
        app && app.appliedAt && new Date(app.appliedAt) >= monthAgo
      ).length;
      
      const recentApplications = applications
        .filter(app => app && app.appliedAt)
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5);
      
      setStats({
        totalApplications: applications.length,
        todayApplications,
        thisWeekApplications,
        thisMonthApplications,
        recentApplications
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="application-stats">
        <div className="loading">Loading application statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-stats">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="application-stats">
      <div className="stats-header">
        <h2>{jobId ? 'Job Application Statistics' : 'Application Statistics'}</h2>
        <p>{jobId ? 'Application tracking for this specific position' : 'Real-time application tracking and analytics'}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalApplications}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.todayApplications}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.thisWeekApplications}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.thisMonthApplications}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      </div>

      <div className="recent-applications">
        <h3>Recent Applications</h3>
        {stats.recentApplications.length === 0 ? (
          <div className="empty-state">
            <p>No recent applications found.</p>
          </div>
        ) : (
          <div className="applications-list">
            {stats.recentApplications.map((application) => (
              <div key={application.id} className="application-item">
                <div className="application-info">
                  <div className="candidate-name">{application.candidateName}</div>
                  <div className="candidate-email">{application.candidateEmail}</div>
                  <div className="application-date">
                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="application-status">
                  <span className={`status-badge ${application.status}`}>
                    {application.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStats;