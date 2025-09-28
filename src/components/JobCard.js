import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JobCard.css';

const JobCard = ({ job, onEdit, onToggleStatus, onClick }) => {
  const navigate = useNavigate();

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(job);
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    onToggleStatus(job.id, job.status);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`job-card ${job.status}`} onClick={handleCardClick}>
      <div className="job-header">
        <div className="job-title">
          <h3>{job.title}</h3>
          <div className="job-badges">
            <span className={`status-badge ${job.status}`}>
              {job.status}
            </span>
            <span className={`experience-badge ${job.experienceLevel?.toLowerCase()}`}>
              {job.experienceLevel || 'Experience'}
            </span>
          </div>
        </div>
        <div className="job-actions">
          <button
            onClick={handleEdit}
            className="btn btn-sm btn-secondary"
            title="Edit Job"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assessments/${job.id}`);
            }}
            className="btn btn-sm btn-info"
            title="Build Assessment"
          >
            📝
          </button>
          <button
            onClick={handleToggleStatus}
            className={`btn btn-sm ${job.status === 'active' ? 'btn-warning' : 'btn-success'}`}
            title={job.status === 'active' ? 'Archive Job' : 'Activate Job'}
          >
            {job.status === 'active' ? '📁' : '📂'}
          </button>
        </div>
      </div>

      <div className="job-content">
        <div className="job-meta">
          <span className="job-slug">/{job.slug}</span>
          <span className="job-order">Order: {job.order}</span>
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="job-tags">
            {job.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="job-dates">
          <span>Created: {formatDate(job.createdAt)}</span>
          <span>Updated: {formatDate(job.updatedAt)}</span>
        </div>
      </div>

      <div className="drag-handle">
        <span>⋮⋮</span>
      </div>
    </div>
  );
};

export default JobCard;
