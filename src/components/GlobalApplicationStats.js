import React, { useState, useEffect, useCallback } from 'react';
import { getJobs } from '../services/jobsApi';
import { getJobApplications, getJobAssignments } from '../services/applicationsApi';
import './GlobalApplicationStats.css';

const GlobalApplicationStats = () => {
  const [jobs, setJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all jobs
      const jobsResponse = await getJobs({ page: 1, pageSize: 1000 });
      const allJobs = jobsResponse.data;
      setJobs(allJobs);

      // Fetch applications and assignments for all jobs
      const applicationsPromises = allJobs.map(job => getJobApplications(job.id));
      const assignmentsPromises = allJobs.map(job => getJobAssignments(job.id));

      const [applicationsResults, assignmentsResults] = await Promise.all([
        Promise.all(applicationsPromises),
        Promise.all(assignmentsPromises)
      ]);

      // Flatten the results
      const flatApplications = applicationsResults.flat();
      const flatAssignments = assignmentsResults.flat();

      setAllApplications(flatApplications);
      setAllAssignments(flatAssignments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate global statistics
  const calculateGlobalStats = () => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const archivedJobs = jobs.filter(job => job.status === 'archived').length;

    const totalApplied = allApplications.length;
    const statusCounts = allApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const totalHired = statusCounts.offered || 0;
    const totalRejected = statusCounts.rejected || 0;
    const totalPending = statusCounts.applied || 0;
    const totalReviewed = statusCounts.reviewed || 0;
    const totalShortlisted = statusCounts.shortlisted || 0;
    const totalInterviewed = statusCounts.interviewed || 0;

    // Assessment statistics
    const totalAssignments = allAssignments.length;
    const submittedAssignments = allAssignments.filter(a => a.status === 'submitted').length;
    const pendingAssignments = allAssignments.filter(a => a.status === 'pending').length;
    const expiredAssignments = allAssignments.filter(a => a.status === 'expired').length;

    // Calculate average score
    const scoredAssignments = allAssignments.filter(a => a.status === 'submitted' && a.obtainedMarks !== undefined);
    const averageScore = scoredAssignments.length > 0 
      ? scoredAssignments.reduce((sum, a) => sum + (a.obtainedMarks || 0), 0) / scoredAssignments.length
      : 0;

    // Calculate conversion rates
    const conversionRate = totalApplied > 0 ? (totalHired / totalApplied * 100) : 0;
    const assessmentCompletionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments * 100) : 0;

    return {
      totalJobs,
      activeJobs,
      archivedJobs,
      totalApplied,
      totalHired,
      totalRejected,
      totalPending,
      totalReviewed,
      totalShortlisted,
      totalInterviewed,
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      expiredAssignments,
      averageScore: Math.round(averageScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      assessmentCompletionRate: Math.round(assessmentCompletionRate * 100) / 100,
      statusCounts
    };
  };

  const stats = calculateGlobalStats();

  if (loading) {
    return (
      <div className="global-stats">
        <div className="loading">Loading global statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="global-stats">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="global-stats">
      <div className="stats-header">
        <h2>Global Application Statistics</h2>
        <button onClick={fetchAllData} className="btn btn-sm btn-secondary">
          🔄 Refresh All Data
        </button>
      </div>

      <div className="stats-grid">
        {/* Job Statistics */}
        <div className="stat-card primary">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalJobs}</div>
            <div className="stat-label">Total Jobs</div>
            <div className="stat-subtitle">{stats.activeJobs} active, {stats.archivedJobs} archived</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalApplied}</div>
            <div className="stat-label">Total Applications</div>
            <div className="stat-subtitle">Across all positions</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalHired}</div>
            <div className="stat-label">Hired Candidates</div>
            <div className="stat-subtitle">{stats.conversionRate}% conversion rate</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.submittedAssignments}</div>
            <div className="stat-label">Assessments Completed</div>
            <div className="stat-subtitle">{stats.assessmentCompletionRate}% completion rate</div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.averageScore}</div>
            <div className="stat-label">Average Score</div>
            <div className="stat-subtitle">Across all assessments</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalRejected}</div>
            <div className="stat-label">Rejected Applications</div>
            <div className="stat-subtitle">Not selected</div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="status-distribution">
        <h3>Application Status Distribution</h3>
        <div className="status-chart">
          <div className="status-bar">
            <div className="status-label">Applied</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill applied" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalPending / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalPending}</div>
          </div>
          
          <div className="status-bar">
            <div className="status-label">Reviewed</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill reviewed" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalReviewed / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalReviewed}</div>
          </div>
          
          <div className="status-bar">
            <div className="status-label">Shortlisted</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill shortlisted" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalShortlisted / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalShortlisted}</div>
          </div>
          
          <div className="status-bar">
            <div className="status-label">Interviewed</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill interviewed" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalInterviewed / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalInterviewed}</div>
          </div>
          
          <div className="status-bar">
            <div className="status-label">Hired</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill offered" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalHired / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalHired}</div>
          </div>
          
          <div className="status-bar">
            <div className="status-label">Rejected</div>
            <div className="status-bar-container">
              <div 
                className="status-bar-fill rejected" 
                style={{ width: `${stats.totalApplied > 0 ? (stats.totalRejected / stats.totalApplied * 100) : 0}%` }}
              ></div>
            </div>
            <div className="status-count">{stats.totalRejected}</div>
          </div>
        </div>
      </div>

      {/* Top Performing Jobs */}
      {jobs.length > 0 && (
        <div className="top-jobs">
          <h3>Top Performing Jobs</h3>
          <div className="jobs-list">
            {jobs
              .map(job => {
                const jobApplications = allApplications.filter(app => app.jobId === job.id);
                const jobHired = jobApplications.filter(app => app.status === 'offered').length;
                const jobConversionRate = jobApplications.length > 0 ? (jobHired / jobApplications.length * 100) : 0;
                return { ...job, applicationCount: jobApplications.length, hiredCount: jobHired, conversionRate: jobConversionRate };
              })
              .sort((a, b) => b.applicationCount - a.applicationCount)
              .slice(0, 5)
              .map((job) => (
                <div key={job.id} className="job-item">
                  <div className="job-info">
                    <h4>{job.title}</h4>
                    <p className="job-status">{job.status}</p>
                  </div>
                  <div className="job-stats">
                    <div className="job-stat">
                      <span className="stat-label">Applications:</span>
                      <span className="stat-value">{job.applicationCount}</span>
                    </div>
                    <div className="job-stat">
                      <span className="stat-label">Hired:</span>
                      <span className="stat-value">{job.hiredCount}</span>
                    </div>
                    <div className="job-stat">
                      <span className="stat-label">Conversion:</span>
                      <span className="stat-value">{Math.round(job.conversionRate * 100) / 100}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalApplicationStats;
