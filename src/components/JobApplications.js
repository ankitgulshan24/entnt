import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getJobApplications, updateApplicationStatus, getJobAssignments } from '../services/applicationsApi';
import './JobApplications.css';

const JobApplications = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [apps, assigns] = await Promise.all([
        getJobApplications(jobId),
        getJobAssignments(jobId)
      ]);
      setApplications(apps);
      setAssignments(assigns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchApplications();
    }
  }, [fetchApplications, jobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      await fetchApplications(); // Refresh applications
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return '#007bff';
      case 'reviewed': return '#ffc107';
      case 'shortlisted': return '#17a2b8';
      case 'interviewed': return '#6f42c1';
      case 'offered': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="job-applications">
        <div className="loading">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-applications">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-applications">
      <div className="applications-header">
        <h2>Job Applications</h2>
        <p>Manage applications and view assignment scores</p>
      </div>

      {applications.length === 0 ? (
        <div className="no-applications">
          <h3>No Applications Yet</h3>
          <p>No candidates have applied for this position yet.</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((application) => {
            const assignment = assignments.find(a => a.candidateId === application.candidateId);
            const hasScore = assignment && assignment.status === 'submitted';
            return (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <div className="candidate-info">
                  <h3>{application.candidateName}</h3>
                  <p>{application.candidateEmail}</p>
                </div>
                <div className="application-status">
                  <select
                    value={application.status}
                    onChange={(e) => handleStatusChange(application.id, e.target.value)}
                    className="status-select"
                    style={{ borderColor: getStatusColor(application.status) }}
                  >
                    <option value="applied">Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="application-content">
                <div className="application-details">
                  <div className="detail-item">
                    <strong>Applied:</strong> {formatDate(application.appliedAt)}
                  </div>
                  <div className="detail-item">
                    <strong>Last Updated:</strong> {formatDate(application.updatedAt)}
                  </div>
                  <div className="detail-item">
                    <strong>Application ID:</strong> {application.id}
                  </div>
                  {assignment && (
                    <div className="detail-item">
                      <strong>Assessment:</strong> {assignment.assessmentTitle || 'Assessment'}
                    </div>
                  )}
                  {hasScore && (
                    <div className="detail-item">
                      <strong>Score:</strong> {assignment.obtainedMarks} / {assignment.totalMarks}
                    </div>
                  )}
                </div>

                <div className="application-actions">
                  <button
                    onClick={() => {/* TODO: View candidate profile */}}
                    className="btn btn-secondary btn-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {/* TODO: View assessment responses */}}
                    className="btn btn-info btn-sm"
                  >
                    {assignment ? 'View Assessment' : 'No Assessment'}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobApplications;
