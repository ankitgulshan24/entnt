import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById } from '../services/jobsApi';
import JobApplications from './JobApplications';
import ApplicationStats from './ApplicationStats';
import JobCandidateStats from './JobCandidateStats';
import './JobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplications, setShowApplications] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Keep jobId as string since job IDs are strings like "job-151"
        console.log('Fetching job with ID:', jobId);
        
        const jobData = await getJobById(jobId);
        console.log('Job data received:', jobData);
        
        if (jobData && jobData.id) {
          setJob(jobData);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleBack = () => {
    navigate('/hr');
  };

  if (loading) {
    return (
      <div className="job-detail">
        <div className="loading">Loading job details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail">
        <div className="not-found">
          <h2>Job Not Found</h2>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <button onClick={handleBack} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        <button onClick={() => navigate('/hr')} className="breadcrumb-link">
          HR Dashboard
        </button>
        <span className="breadcrumb-separator">›</span>
        <button onClick={() => navigate('/hr')} className="breadcrumb-link">
          Jobs Management
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{job.title}</span>
      </nav>

      <div className="job-detail-header">
        <div className="job-header-actions">
          <button onClick={handleBack} className="btn btn-secondary back-btn">
            ← Back
          </button>
          <button 
            onClick={() => {
              console.log('Assessment button clicked for jobId:', jobId);
              console.log('Navigating to:', `/assessments/${jobId}`);
              navigate(`/assessments/${jobId}`);
            }} 
            className="btn btn-primary assessment-btn"
          >
            📝 Manage Assessment
          </button>
        </div>
        <div className="job-status">
          <span className={`status-badge ${job.status}`}>
            {job.status}
          </span>
        </div>
      </div>

      <div className="job-detail-content">
        <div className="job-main">
          <h1 className="job-title">{job.title}</h1>
          <div className="job-meta">
            <span className="job-slug">/{job.slug}</span>
            <span className="job-id">ID: {job.id}</span>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="job-tags">
              <h3>Skills & Technologies</h3>
              <div className="tags-list">
                {job.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="job-description">
            <h3>Job Description</h3>
            <p>
              This is a detailed description for the {job.title} position. 
              We are looking for a talented individual to join our team and 
              contribute to our exciting projects.
            </p>
            <p>
              The ideal candidate will have experience with the technologies 
              listed above and be passionate about creating high-quality solutions.
            </p>
          </div>

          <div className="job-requirements">
            <h3>Requirements</h3>
            <ul>
              <li>Bachelor's degree in Computer Science or related field</li>
              <li>3+ years of relevant experience</li>
              <li>Strong problem-solving skills</li>
              <li>Excellent communication skills</li>
              <li>Ability to work in a team environment</li>
            </ul>
          </div>

          <div className="job-dates">
            <div className="date-item">
              <strong>Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}
            </div>
            <div className="date-item">
              <strong>Last Updated:</strong> {new Date(job.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="job-sidebar">
          {/* HR Management Information */}
          <div className="hr-info-card">
            {/* Candidate Statistics */}
            <JobCandidateStats jobId={jobId} />
          </div>

          <div className="job-info-card">
            <h4>Job Information</h4>
            <div className="info-item">
              <strong>Position:</strong> {job.title}
            </div>
            <div className="info-item">
              <strong>Status:</strong> 
              <span className={`status-text ${job.status}`}>
                {job.status === 'active' ? 'Open' : 'Closed'}
              </span>
            </div>
            <div className="info-item">
              <strong>Experience Level:</strong> 
              <span className={`experience-text ${job.experienceLevel?.toLowerCase()}`}>
                {job.experienceLevel || 'Experience'}
              </span>
            </div>
            <div className="info-item">
              <strong>Order:</strong> #{job.order}
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="applications-section">
        {/* Application Statistics */}
        <ApplicationStats jobId={jobId} />
        
        <div className="applications-header">
          <h2>Applications for this Job</h2>
          <button
            onClick={() => setShowApplications(!showApplications)}
            className="btn btn-secondary"
          >
            {showApplications ? 'Hide Applications' : 'View Applications'}
          </button>
        </div>
        
        {showApplications && (
          <JobApplications />
        )}
      </div>
    </div>
  );
};

export default JobDetail;
