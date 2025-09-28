import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidate, getCandidateTimeline, getCandidateNotes, addCandidateNote } from '../services/candidatesApi';
import { getJobById } from '../services/jobsApi';
import { retryApiCall, waitForApiReady } from '../utils/apiReady';
import './CandidateProfile.css';

const CandidateProfile = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const textareaRef = useRef(null);

  // Sample users for @mentions
  const mentionUsers = [
    { id: 'hr1', name: 'Sarah Johnson', role: 'HR Manager' },
    { id: 'hr2', name: 'Mike Chen', role: 'Recruiter' },
    { id: 'hr3', name: 'Emily Davis', role: 'HR Director' },
    { id: 'hr4', name: 'David Wilson', role: 'Talent Acquisition' },
    { id: 'hr5', name: 'Lisa Rodriguez', role: 'HR Coordinator' }
  ];

  const stages = [
    { id: 'applied', title: 'Applied', color: '#007bff' },
    { id: 'screening', title: 'Screening', color: '#ffc107' },
    { id: 'interview', title: 'Interview', color: '#17a2b8' },
    { id: 'offer', title: 'Offer', color: '#28a745' },
    { id: 'hired', title: 'Hired', color: '#6f42c1' },
    { id: 'rejected', title: 'Rejected', color: '#dc3545' }
  ];

  const fetchCandidateData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await waitForApiReady(5000);
      
      // Fetch candidate data
      const candidateData = await retryApiCall(() => getCandidate(candidateId));
      setCandidate(candidateData);
      
      // Fetch job data if candidate has jobId
      if (candidateData.jobId) {
        try {
          const jobData = await retryApiCall(() => getJobById(candidateData.jobId));
          setJob(jobData);
        } catch (jobError) {
          console.warn('Could not fetch job data:', jobError);
        }
      }
      
      // Fetch timeline data
      try {
        const timelineData = await retryApiCall(() => getCandidateTimeline(candidateId));
        setTimeline(Array.isArray(timelineData) ? timelineData : []);
      } catch (timelineError) {
        console.warn('Could not fetch timeline data:', timelineError);
        setTimeline([]);
      }
      
      // Fetch notes data
      try {
        const notesData = await retryApiCall(() => getCandidateNotes(candidateId));
        setNotes(Array.isArray(notesData) ? notesData : []);
      } catch (notesError) {
        console.warn('Could not fetch notes data:', notesError);
        setNotes([]);
      }
      
    } catch (err) {
      console.error('Error fetching candidate data:', err);
      setError('Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      const noteData = {
        content: newNote.trim(),
        author: 'HR Manager', // In real app, this would come from user context
        candidateId: candidateId
      };
      
      await retryApiCall(() => addCandidateNote(noteData));
      setNewNote('');
      setShowMentions(false);
      // Refresh notes
      const updatedNotes = await retryApiCall(() => getCandidateNotes(candidateId));
      setNotes(Array.isArray(updatedNotes) ? updatedNotes : []);
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  // Handle @mentions functionality
  const handleNoteChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setNewNote(value);
    
    // Check for @mention trigger
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');
      
      if (!hasSpaceAfterAt) {
        setMentionQuery(textAfterAt);
        setMentionPosition(atIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user) => {
    const beforeMention = newNote.substring(0, mentionPosition);
    const afterMention = newNote.substring(mentionPosition + mentionQuery.length + 1);
    const mentionText = `@${user.name}`;
    
    setNewNote(beforeMention + mentionText + afterMention);
    setShowMentions(false);
    setMentionQuery('');
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPosition = beforeMention.length + mentionText.length;
      setTimeout(() => {
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (showMentions) {
      if (e.key === 'Escape') {
        setShowMentions(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Could implement keyboard navigation here
      }
    }
  };

  const renderNoteContent = (content) => {
    // Simple regex to find @mentions and highlight them
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="mention-highlight">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredMentionUsers = mentionUsers.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getStageInfo = (stageId) => {
    return stages.find(stage => stage.id === stageId) || { title: stageId, color: '#666' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleBack = () => {
    navigate('/hr');
  };

  if (loading) {
    return (
      <div className="candidate-profile">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading candidate profile...</div>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="candidate-profile">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Candidate not found'}</p>
          <button onClick={handleBack} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-profile">
      <div className="profile-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Candidate Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <div className="candidate-info">
            <div className="candidate-avatar">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div className="candidate-details">
              <h2>{candidate.name}</h2>
              <p className="candidate-email">{candidate.email}</p>
              <div className="candidate-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStageInfo(candidate.stage).color }}
                >
                  {getStageInfo(candidate.stage).title}
                </span>
              </div>
            </div>
          </div>

          {job && (
            <div className="job-info">
              <h3>Applied Job</h3>
              <div className="job-card">
                <h4>{job.title}</h4>
                <p className="job-location">{job.location}</p>
                <p className="job-salary">{job.salary}</p>
                <div className="job-tags">
                  {job.tags?.map((tag, index) => (
                    <span key={index} className="job-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="notes-section">
            <h3>Notes</h3>
            <form onSubmit={handleAddNote} className="add-note-form">
              <div className="note-input-container">
                <textarea
                  ref={textareaRef}
                  value={newNote}
                  onChange={handleNoteChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a note about this candidate... Use @ to mention team members"
                  className="note-input"
                  rows="3"
                />
                {showMentions && (
                  <div className="mentions-dropdown">
                    <div className="mentions-header">Mention team members:</div>
                    {filteredMentionUsers.length > 0 ? (
                      filteredMentionUsers.map(user => (
                        <div
                          key={user.id}
                          className="mention-item"
                          onClick={() => handleMentionSelect(user)}
                        >
                          <div className="mention-name">@{user.name}</div>
                          <div className="mention-role">{user.role}</div>
                        </div>
                      ))
                    ) : (
                      <div className="mention-item no-results">No matching users</div>
                    )}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={addingNote || !newNote.trim()}
                className="btn btn-primary"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </form>
            
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-content">{renderNoteContent(note.content)}</div>
                  <div className="note-meta">
                    <span className="note-author">{note.author}</span>
                    <span className="note-date">{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="no-notes">No notes yet. Add the first note above.</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="timeline-section">
            <h3>Timeline</h3>
            <div className="timeline">
              {timeline.map((entry, index) => (
                <div key={entry.id || index} className="timeline-item">
                  <div className="timeline-marker">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: getStageInfo(entry.stage).color }}
                    ></div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      {getStageInfo(entry.stage).title}
                    </div>
                    <div className="timeline-description">
                      {entry.notes || `Moved to ${getStageInfo(entry.stage).title}`}
                    </div>
                    <div className="timeline-date">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="no-timeline">No timeline entries yet.</p>
              )}
            </div>
          </div>

          <div className="candidate-stats">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{timeline.length}</div>
                <div className="stat-label">Timeline Entries</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{notes.length}</div>
                <div className="stat-label">Notes</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {candidate.createdAt ? 
                    Math.ceil((new Date() - new Date(candidate.createdAt)) / (1000 * 60 * 60 * 24))
                    : 0
                  }
                </div>
                <div className="stat-label">Days in Pipeline</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
