import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import { getCandidates, updateCandidateStage, createCandidate, deleteCandidate, getPersistedStageChanges } from '../services/candidatesApi';
import { retryApiCall, waitForApiReady } from '../utils/apiReady';
import './CandidatesKanban.css';

const CandidatesKanban = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCandidateInputs, setNewCandidateInputs] = useState({});
  const [addingCandidate, setAddingCandidate] = useState({});
  const [showStageMenu, setShowStageMenu] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const stages = [
    { id: 'applied', title: 'Applied', color: '#007bff' },
    { id: 'screening', title: 'Screening', color: '#ffc107' },
    { id: 'interview', title: 'Interview', color: '#17a2b8' },
    { id: 'offer', title: 'Offer', color: '#28a745' },
    { id: 'hired', title: 'Hired', color: '#6f42c1' },
    { id: 'rejected', title: 'Rejected', color: '#dc3545' }
  ];

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching candidates for kanban...');
      
      // Wait for API to be ready
      await waitForApiReady(5000);
      
      // Use retry mechanism for API call
      const response = await retryApiCall(() => getCandidates({ page: 1, pageSize: 1000 }));
      console.log('Kanban API response:', response);
      
      // Ensure response has the expected structure
      let candidateData = [];
      if (response && typeof response === 'object') {
        candidateData = Array.isArray(response.data) ? response.data : [];
      } else {
        // If response is not an object, treat it as an array (backward compatibility)
        candidateData = Array.isArray(response) ? response : [];
      }

      // Additional safety check
      if (!Array.isArray(candidateData)) {
        console.error('candidateData is not an array:', candidateData);
        candidateData = [];
      }

      // Apply persisted stage changes from localStorage
      const persistedChanges = getPersistedStageChanges();
      console.log('Persisted changes:', persistedChanges);
      
      const updatedCandidates = candidateData.map(candidate => {
        if (candidate && typeof candidate === 'object' && persistedChanges[candidate.id]) {
          console.log(`Applying persisted stage change for candidate ${candidate.id}: ${candidate.stage} -> ${persistedChanges[candidate.id]}`);
          return { ...candidate, stage: persistedChanges[candidate.id] };
        }
        return candidate;
      }).filter(candidate => candidate && typeof candidate === 'object');

      setCandidates(updatedCandidates);
    } catch (err) {
      console.error('Error fetching candidates for kanban:', err);
      // Don't show error to user, just set empty array
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Close stage menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStageMenu && !event.target.closest('.stage-menu-container')) {
        setShowStageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStageMenu]);

  const getCandidatesByStage = (stageId) => {
    try {
      if (!Array.isArray(candidates)) {
        console.log('Candidates not available or not an array in kanban:', candidates);
        return [];
      }
      
      const stageCandidates = candidates.filter(candidate => {
        try {
          return candidate && 
            typeof candidate === 'object' && 
            !Array.isArray(candidate) &&
            candidate.stage === stageId;
        } catch (err) {
          console.warn('Error filtering candidate in kanban:', err, candidate);
          return false;
        }
      });
      
      console.log(`Candidates for stage ${stageId}:`, stageCandidates.length, stageCandidates);
      return stageCandidates;
    } catch (error) {
      console.error('Error in getCandidatesByStage:', error);
      return [];
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleDragEnd = async (result) => {
    try {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const candidateId = draggableId;
      const newStage = destination.droppableId;

      // Safety check for candidates array
      if (!Array.isArray(candidates)) {
        console.error('Candidates is not an array in handleDragEnd:', candidates);
        return;
      }

      // Safety check for candidate existence
      const candidate = candidates.find(c => c && typeof c === 'object' && c.id === candidateId);
      if (!candidate) {
        console.error('Candidate not found:', candidateId);
        return;
      }

      // Optimistic update
      setCandidates(prevCandidates => {
        if (!Array.isArray(prevCandidates)) {
          console.error('prevCandidates is not an array:', prevCandidates);
          return [];
        }
        
        return prevCandidates.map(candidate =>
          candidate && typeof candidate === 'object' && candidate.id === candidateId
            ? { ...candidate, stage: newStage }
            : candidate
        ).filter(candidate => candidate && typeof candidate === 'object');
      });

      try {
        await updateCandidateStage(candidateId, newStage);
      } catch (error) {
        console.error('Error updating candidate stage:', error);
        // Revert on error
        setCandidates(prevCandidates => {
          if (!Array.isArray(prevCandidates)) {
            console.error('prevCandidates is not an array in revert:', prevCandidates);
            return [];
          }
          
          return prevCandidates.map(candidate =>
            candidate && typeof candidate === 'object' && candidate.id === candidateId
              ? { ...candidate, stage: source.droppableId }
              : candidate
          ).filter(candidate => candidate && typeof candidate === 'object');
        });
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
    }
  };

  const handleInputChange = (stageId, field, value) => {
    setNewCandidateInputs(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value
      }
    }));
  };

  const handleAddCandidate = async (stageId) => {
    try {
      const input = newCandidateInputs[stageId];
      console.log('Adding candidate for stage:', stageId, 'with input:', input);
      
      if (!input || !input.name || !input.email) {
        alert('Please enter both name and email');
        return;
      }

      setAddingCandidate(prev => ({ ...prev, [stageId]: true }));

      const newCandidate = {
        name: input.name.trim(),
        email: input.email.trim(),
        stage: stageId,
        jobId: null, // Can be set later
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Sending candidate data:', newCandidate);
      const createdCandidate = await createCandidate(newCandidate);
      console.log('Received created candidate:', createdCandidate);
      
      // Safety check for createdCandidate
      if (!createdCandidate || typeof createdCandidate !== 'object') {
        console.error('Invalid created candidate:', createdCandidate);
        throw new Error('Invalid candidate data received');
      }

      // Add to local state
      setCandidates(prev => {
        if (!Array.isArray(prev)) {
          console.error('prev is not an array in handleAddCandidate:', prev);
          return [createdCandidate];
        }
        const updated = [...prev, createdCandidate];
        console.log('Updated candidates list:', updated);
        return updated;
      });
      
      // Clear input
      setNewCandidateInputs(prev => ({
        ...prev,
        [stageId]: { name: '', email: '' }
      }));

      console.log('Candidate added successfully:', createdCandidate);
    } catch (error) {
      console.error('Error adding candidate:', error);
      // Don't show error to user
    } finally {
      setAddingCandidate(prev => ({ ...prev, [stageId]: false }));
    }
  };

  const handleDeleteCandidate = async (candidateId, currentStage) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await deleteCandidate(candidateId);
        
        // Remove from local state
        setCandidates(prev => {
          if (!Array.isArray(prev)) {
            console.error('prev is not an array in handleDeleteCandidate:', prev);
            return [];
          }
          return prev.filter(candidate => candidate && typeof candidate === 'object' && candidate.id !== candidateId);
        });
        
        console.log('Candidate deleted successfully:', candidateId);
      } catch (error) {
        console.error('Error deleting candidate:', error);
        // Don't show error to user
      }
    }
  };

  const handleMoveToStage = async (candidateId, newStage) => {
    try {
      const candidate = candidates.find(c => c && c.id === candidateId);
      if (!candidate) {
        console.error('Candidate not found:', candidateId);
        return;
      }

      // Optimistic update
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate =>
          candidate && candidate.id === candidateId
            ? { ...candidate, stage: newStage }
            : candidate
        )
      );

      await updateCandidateStage(candidateId, newStage);
      setShowStageMenu(null);
    } catch (error) {
      console.error('Error moving candidate to stage:', error);
    }
  };

  const toggleStageMenu = (candidateId) => {
    setShowStageMenu(showStageMenu === candidateId ? null : candidateId);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        const results = candidates.filter(candidate =>
          candidate && candidate.email && candidate.email.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchInput, candidates]);

  const clearSearch = () => {
    setSearchInput('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const getStageTitle = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.title : stageId;
  };

  const getStageColor = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.color : '#6c757d';
  };

  const handleCandidateClick = (candidateId) => {
    navigate(`/candidates/${candidateId}`);
  };

  if (loading) {
    return (
      <div className="candidates-kanban">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading candidates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidates-kanban">
      <div className="kanban-header">
        <h2>Candidate Pipeline</h2>
        
        {/* Pipeline Search */}
        <div className="pipeline-search">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchInput}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchInput && (
              <button onClick={clearSearch} className="clear-search-btn">
                ×
              </button>
            )}
          </div>
          
          {showSearchResults && (
            <div className="search-results">
              <div className="search-results-header">
                <h4>Search Results</h4>
                <button onClick={clearSearch} className="close-search-btn">×</button>
              </div>
              {searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map(candidate => (
                    <div key={candidate.id} className="search-result-item">
                      <div className="candidate-details">
                        <h4>{candidate.name || 'Unknown'}</h4>
                        <p className="candidate-email-small">{candidate.email}</p>
                      </div>
                      <div className="candidate-stage">
                        <span 
                          className="stage-badge"
                          style={{ backgroundColor: getStageColor(candidate.stage) }}
                        >
                          {getStageTitle(candidate.stage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">No candidates found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {stages.map(stage => (
            <div key={stage.id} className={`kanban-column ${stage.id}`}>
              <div className="column-header">
                <h3>{stage.title}</h3>
                <span className="candidate-count">{getCandidatesByStage(stage.id).length}</span>
              </div>
              
              <div className="column-content">
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`droppable-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {getCandidatesByStage(stage.id).map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`candidate-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <div className="candidate-info">
                                <h4
                                  className="candidate-name clickable"
                                  onClick={() => handleCandidateClick(candidate.id)}
                                  title="Click to view profile"
                                >
                                  {candidate.name || 'Unknown'}
                                </h4>
                                <p className="candidate-email">{candidate.email || 'No email'}</p>
                              </div>
                              
                              <div className="candidate-actions">
                                <button
                                  className="action-btn move-btn"
                                  onClick={() => toggleStageMenu(candidate.id)}
                                  title="Move to stage"
                                >
                                  Move
                                </button>
                                <button
                                  className="action-btn delete-btn"
                                  onClick={() => handleDeleteCandidate(candidate.id, candidate.stage)}
                                  title="Delete candidate"
                                >
                                  Delete
                                </button>
                              </div>

                              {showStageMenu === candidate.id && (
                                <div className="stage-menu-container">
                                  <div className="stage-menu">
                                    {stages.filter(s => s.id !== candidate.stage).map(stageOption => (
                                      <button
                                        key={stageOption.id}
                                        className="stage-menu-item"
                                        onClick={() => handleMoveToStage(candidate.id, stageOption.id)}
                                        style={{ color: stageOption.color }}
                                      >
                                        Move to {stageOption.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Add Candidate Form */}
                      <div className="add-candidate-form">
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="Name"
                            value={newCandidateInputs[stage.id]?.name || ''}
                            onChange={(e) => handleInputChange(stage.id, 'name', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="email"
                            placeholder="Email"
                            value={newCandidateInputs[stage.id]?.email || ''}
                            onChange={(e) => handleInputChange(stage.id, 'email', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <button
                          className="add-candidate-btn"
                          onClick={() => handleAddCandidate(stage.id)}
                          disabled={addingCandidate[stage.id]}
                        >
                          {addingCandidate[stage.id] ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default CandidatesKanban;