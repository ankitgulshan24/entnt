import React, { useState, useEffect, useCallback } from 'react';
import { getCandidates } from '../services/candidatesApi';
import './JobCandidateStats.css';

const JobCandidateStats = ({ jobId }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCandidates({ page: 1, pageSize: 1000 });
      
      if (response && response.data) {
        // Filter candidates for this specific job (jobId is a string like "job-151")
        const jobCandidates = response.data.filter(candidate => 
          candidate.jobId === jobId
        );
        setCandidates(jobCandidates);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      setError(err.message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchCandidates();
    }
  }, [fetchCandidates, jobId]);

  const getStageStats = () => {
    try {
      const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
      const stats = {};
      
      // Ensure candidates is an array
      if (!Array.isArray(candidates)) {
        console.warn('Candidates is not an array in getStageStats:', candidates);
        return {};
      }
      
      stages.forEach(stage => {
        stats[stage] = candidates.filter(candidate => 
          candidate && typeof candidate === 'object' && candidate.stage === stage
        ).length;
      });
      
      return stats;
    } catch (error) {
      console.error('Error in getStageStats:', error);
      return {};
    }
  };

  const getTotalCandidates = () => {
    return candidates.length;
  };

  const getStageColor = (stage) => {
    const colors = {
      'applied': '#007bff',
      'screening': '#ffc107',
      'interview': '#17a2b8',
      'offer': '#28a745',
      'hired': '#6f42c1',
      'rejected': '#dc3545'
    };
    return colors[stage] || '#6c757d';
  };

  const getStageTitle = (stage) => {
    const titles = {
      'applied': 'Applied',
      'screening': 'Screening',
      'interview': 'Interview',
      'offer': 'Offer',
      'hired': 'Hired',
      'rejected': 'Rejected'
    };
    return titles[stage] || stage;
  };

  if (loading) {
    return (
      <div className="job-candidate-stats">
        <div className="loading">Loading candidate statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-candidate-stats">
        <div className="error">Error loading statistics: {error}</div>
      </div>
    );
  }

  const stageStats = getStageStats();
  const totalCandidates = getTotalCandidates();

  return (
    <div className="job-candidate-stats">
      <div className="stats-header">
        <h4>Candidate Pipeline</h4>
        <div className="total-candidates">
          Total: <span className="total-number">{totalCandidates}</span>
        </div>
      </div>
      
      <div className="stats-grid">
        {Object.entries(stageStats || {}).map(([stage, count]) => (
          <div key={stage} className="stat-item">
            <div 
              className="stat-circle"
              style={{ backgroundColor: getStageColor(stage) }}
            >
              {count}
            </div>
            <div className="stat-label">{getStageTitle(stage)}</div>
          </div>
        ))}
      </div>
      
      {totalCandidates === 0 && (
        <div className="no-candidates">
          <p>No candidates have applied for this position yet.</p>
        </div>
      )}
    </div>
  );
};

export default JobCandidateStats;
