import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { getCandidates } from '../services/candidatesApi';
import './CandidatesList.css';

// Safety wrapper for react-window List component
const SafeList = ({ children, ...props }) => {
  try {
    return <List {...props}>{children}</List>;
  } catch (error) {
    console.error('Error with react-window List:', error);
    // Fallback to regular div rendering
    return (
      <div style={{ height: props.height || 600, overflow: 'auto' }}>
        {Array.from({ length: props.itemCount || 0 }, (_, index) => 
          children({ index, style: { height: props.itemSize || 80 } })
        )}
      </div>
    );
  }
};

const CandidatesList = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    stage: 'all',
    sort: 'name',
    page: 1,
    pageSize: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

  // Fetch candidates with pagination
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching candidates with filters:', filters);
      const response = await getCandidates(filters);
      console.log('Candidates API response:', response);
      
      // Ensure response has the expected structure
      if (response && typeof response === 'object') {
        const candidateData = Array.isArray(response.data) ? response.data : [];
        const paginationData = response.pagination || { total: 0, totalPages: 0, currentPage: 1 };
        
        console.log('Setting candidates:', candidateData.length, 'items');
        setCandidates(candidateData);
        setPagination(paginationData);
      } else {
        // If response is not an object, treat it as an array (backward compatibility)
        const candidateData = Array.isArray(response) ? response : [];
        console.log('Setting candidates (fallback):', candidateData.length, 'items');
        setCandidates(candidateData);
        setPagination({ total: 0, totalPages: 0, currentPage: 1 });
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.message);
      setCandidates([]);
      setPagination({ total: 0, totalPages: 0, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Filter and sort candidates (now done server-side, but keeping for display)
  const filteredCandidates = useMemo(() => {
    try {
      // Since filtering is now done server-side, just return the candidates
      // Add extra safety checks
      if (!candidates || !Array.isArray(candidates)) {
        console.log('Candidates not available or not an array:', candidates);
        return [];
      }
      
      // Ensure all candidates are valid objects
      const validCandidates = candidates.filter(candidate => {
        try {
          return candidate && 
            typeof candidate === 'object' && 
            candidate.id && 
            candidate.name &&
            !Array.isArray(candidate); // Ensure it's not an array
        } catch (err) {
          console.warn('Error filtering candidate:', err, candidate);
          return false;
        }
      });
      
      console.log('Valid candidates count:', validCandidates.length);
      return validCandidates;
    } catch (error) {
      console.error('Error in filteredCandidates useMemo:', error);
      return [];
    }
  }, [candidates]);

  const handleCandidateClick = (candidateId) => {
    navigate(`/candidates/${candidateId}`);
  };

  const getStageColor = (stage) => {
    const colors = {
      applied: '#007bff',
      screening: '#ffc107',
      interview: '#17a2b8',
      offer: '#28a745',
      hired: '#6f42c1',
      rejected: '#dc3545'
    };
    return colors[stage] || '#6c757d';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Row component for virtualization
  const CandidateRow = ({ index, style }) => {
    try {
      // Comprehensive safety checks
      if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
        console.warn('FilteredCandidates is not valid in CandidateRow:', filteredCandidates);
        return (
          <div style={style} className="candidate-row">
            <div className="candidate-info">
              <div className="candidate-avatar">?</div>
              <div className="candidate-details">
                <h4 className="candidate-name">Loading...</h4>
                <p className="candidate-email">Please wait...</p>
              </div>
            </div>
          </div>
        );
      }

      // Check index bounds
      if (typeof index !== 'number' || isNaN(index) || index < 0 || index >= filteredCandidates.length) {
        console.warn('Invalid index in CandidateRow:', index, 'length:', filteredCandidates.length);
        return (
          <div style={style} className="candidate-row">
            <div className="candidate-info">
              <div className="candidate-avatar">?</div>
              <div className="candidate-details">
                <h4 className="candidate-name">Loading...</h4>
                <p className="candidate-email">Please wait...</p>
              </div>
            </div>
          </div>
        );
      }

      const candidate = filteredCandidates[index];
      
      // Better error handling for undefined candidate
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        console.warn('Invalid candidate object in CandidateRow:', candidate);
        return (
          <div style={style} className="candidate-row">
            <div className="candidate-info">
              <div className="candidate-avatar">?</div>
              <div className="candidate-details">
                <h4 className="candidate-name">Invalid Data</h4>
                <p className="candidate-email">Please refresh...</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          style={style}
          className="candidate-row"
          onClick={() => handleCandidateClick(candidate.id)}
        >
          <div className="candidate-info">
            <div className="candidate-avatar">
              {candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="candidate-details">
              <h4 className="candidate-name">{candidate.name || 'Unknown'}</h4>
              <p className="candidate-email">{candidate.email || 'No email'}</p>
              <p className="candidate-job">
                Applied for: {candidate.jobId ? `Job ${candidate.jobId}` : 'No job specified'}
              </p>
            </div>
          </div>
          <div className="candidate-meta">
            <span
              className="stage-badge"
              style={{ backgroundColor: getStageColor(candidate.stage) }}
            >
              {candidate.stage || 'unknown'}
            </span>
            <span className="candidate-date">
              {candidate.createdAt ? formatDate(candidate.createdAt) : 'Unknown date'}
            </span>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in CandidateRow:', error);
      return (
        <div style={style} className="candidate-row">
          <div className="candidate-info">
            <div className="candidate-avatar">!</div>
            <div className="candidate-details">
              <h4 className="candidate-name">Error</h4>
              <p className="candidate-email">Failed to render</p>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="candidates-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading candidates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidates-list">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Comprehensive safety check to prevent rendering with invalid data
  if (!Array.isArray(candidates)) {
    console.error('Candidates is not an array:', candidates);
    return (
      <div className="candidates-list">
        <div className="error-message">
          <h3>Data Error</h3>
          <p>Unable to load candidates data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Additional safety check for filteredCandidates
  if (!Array.isArray(filteredCandidates)) {
    console.error('FilteredCandidates is not an array:', filteredCandidates);
    return (
      <div className="candidates-list">
        <div className="error-message">
          <h3>Filtering Error</h3>
          <p>Unable to process candidates data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidates-list">
      <div className="candidates-header">
        <h2>Candidates Management</h2>
        <p>Manage and track candidate progress through the hiring pipeline</p>
      </div>

      <div className="candidates-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <select
            value={filters.stage}
            onChange={(e) => handleFilterChange({ stage: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ sort: e.target.value })}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="stage">Sort by Stage</option>
            <option value="createdAt">Sort by Date</option>
          </select>
        </div>
      </div>

      <div className="candidates-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredCandidates.length}</span>
          <span className="stat-label">Total Candidates</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {(() => {
              try {
                if (!Array.isArray(candidates)) return 0;
                return candidates.filter(c => c && c.stage === 'applied').length;
              } catch (error) {
                console.error('Error calculating applied count:', error);
                return 0;
              }
            })()}
          </span>
          <span className="stat-label">Applied</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {(() => {
              try {
                if (!Array.isArray(candidates)) return 0;
                return candidates.filter(c => c && c.stage === 'hired').length;
              } catch (error) {
                console.error('Error calculating hired count:', error);
                return 0;
              }
            })()}
          </span>
          <span className="stat-label">Hired</span>
        </div>
      </div>

      <div className="candidates-table">
        <div className="table-header">
          <div className="header-cell">Candidate</div>
          <div className="header-cell">Stage</div>
          <div className="header-cell">Applied Date</div>
        </div>
        
        <div className="table-body">
          {filteredCandidates.length > 0 && Array.isArray(filteredCandidates) ? (
            <div className="virtualized-list-container">
              {(() => {
                try {
                  // Additional safety checks for react-window
                  const safeItemCount = Math.max(0, filteredCandidates.length || 0);
                  const safeItemSize = 80;
                  const safeHeight = 600;
                  const safeWidth = "100%";
                  
                  // Ensure all props are valid numbers/strings
                  if (typeof safeItemCount !== 'number' || isNaN(safeItemCount)) {
                    console.error('Invalid itemCount for List:', safeItemCount);
                    return (
                      <div className="no-candidates">
                        <h3>Data Error</h3>
                        <p>Invalid data format. Please refresh the page.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <SafeList
                      height={safeHeight}
                      itemCount={safeItemCount}
                      itemSize={safeItemSize}
                      width={safeWidth}
                    >
                      {CandidateRow}
                    </SafeList>
                  );
                } catch (error) {
                  console.error('Error rendering List component:', error);
                  return (
                    <div className="no-candidates">
                      <h3>Rendering Error</h3>
                      <p>Failed to render candidate list. Please refresh the page.</p>
                    </div>
                  );
                }
              })()}
            </div>
          ) : (
            <div className="no-candidates">
              <h3>No candidates found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;