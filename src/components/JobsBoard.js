import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import JobCard from './JobCard';
import JobModal from './JobModal';
import { getJobs, reorderJobs, toggleJobStatus } from '../services/jobsApi';
import { retryApiCall, waitForApiReady } from '../utils/apiReady';
import './JobsBoard.css';

const JobsBoard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    experienceLevel: '',
    page: 1,
    pageSize: 20,
    sort: 'order'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [searchInput, setSearchInput] = useState('');
  const debounceTimeoutRef = useRef(null);

  // Fetch jobs from API
  const fetchJobs = useCallback(async (searchFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching jobs with filters:', searchFilters);
      
      // Wait for API to be ready
      await waitForApiReady(5000);
      
      // Use retry mechanism for API call
      const response = await retryApiCall(() => getJobs(searchFilters));
      console.log('Jobs API response:', response);
      console.log('Response data:', response?.data);
      console.log('Response pagination:', response?.pagination);
      
      if (response && response.data) {
        setJobs(response.data);
        setPagination(response.pagination || { total: 0, totalPages: 0, currentPage: 1 });
        console.log('Pagination data:', response.pagination);
        console.log('Jobs loaded:', response.data.length);
      } else {
        setJobs([]);
        setPagination({ total: 0, totalPages: 0, currentPage: 1 });
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput,
        page: 1
      }));
    }, 300); // 300ms delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Load jobs when filters change
  useEffect(() => {
    fetchJobs(filters);
  }, [filters, fetchJobs]);

  // Handle drag and drop reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceIndex = source.index;
    const destinationIndex = destination.index;

    if (sourceIndex === destinationIndex) return;

    const job = jobs[sourceIndex];
    const fromOrder = job.order;
    const toOrder = jobs[destinationIndex].order;

    // Optimistic update
    const newJobs = Array.from(jobs);
    const [reorderedJob] = newJobs.splice(sourceIndex, 1);
    newJobs.splice(destinationIndex, 0, reorderedJob);
    setJobs(newJobs);

    try {
      await reorderJobs(job.id, fromOrder, toOrder);
      // Refresh the list to get the correct order from server
      await fetchJobs();
    } catch (err) {
      setError(err.message);
      // Rollback on failure
      await fetchJobs();
    }
  };

  // Handle job status toggle (archive/unarchive)
  const handleToggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    
    try {
      await toggleJobStatus(jobId, newStatus);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle job edit
  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowModal(true);
  };

  // Handle job creation
  const handleCreateJob = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
  };

  // Handle successful job save
  const handleJobSaved = () => {
    handleCloseModal();
    fetchJobs();
  };

  // Handle filter changes (non-search filters)
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="jobs-board">
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="jobs-board">
      <div className="jobs-header">
        <h2>Jobs Management</h2>
        <button 
          className="btn btn-primary"
          onClick={handleCreateJob}
        >
          Create New Job
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="jobs-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchInput}
            onChange={handleSearchChange}
            className="form-control"
          />
        </div>
        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="form-control"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filters.experienceLevel}
            onChange={(e) => handleFilterChange({ experienceLevel: e.target.value })}
            className="form-control"
          >
            <option value="">All Experience Levels</option>
            <option value="Fresher">Fresher</option>
            <option value="Experience">Experience</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ sort: e.target.value })}
            className="form-control"
          >
            <option value="order">Order</option>
            <option value="title">Title</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filters.pageSize}
            onChange={(e) => handleFilterChange({ pageSize: parseInt(e.target.value), page: 1 })}
            className="form-control"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      <div className="jobs-stats">
        <span>Total: {pagination.total} jobs</span>
        <span>Showing: {jobs.length} jobs</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="jobs-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="jobs-list"
            >
              {jobs.map((job, index) => (
                <Draggable key={job.id} draggableId={job.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`job-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <JobCard
                        job={job}
                        onEdit={handleEditJob}
                        onToggleStatus={handleToggleStatus}
                        onClick={() => handleJobClick(job.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {pagination.totalPages > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {jobs.length} of {pagination.total} jobs
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="btn btn-secondary"
            >
              ← Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`page-number ${page === pagination.currentPage ? 'active' : ''}`}
                  disabled={page === pagination.currentPage}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="btn btn-secondary"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <JobModal
          job={editingJob}
          onClose={handleCloseModal}
          onSave={handleJobSaved}
        />
      )}
    </div>
  );
};

export default JobsBoard;

