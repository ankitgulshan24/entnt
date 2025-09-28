import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCandidateNotes, addCandidateNote } from '../services/candidatesApi';
import './NotesSection.css';

const NotesSection = ({ candidateId, onAddNote }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef(null);

  // Mock team members for @mentions
  const teamMembers = [
    { id: 'hr-1', name: 'Sarah Johnson', role: 'HR Manager' },
    { id: 'hr-2', name: 'Mike Davis', role: 'Recruiter' },
    { id: 'hr-3', name: 'Emily Wilson', role: 'Hiring Manager' },
    { id: 'hr-4', name: 'David Brown', role: 'Technical Lead' }
  ];

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCandidateNotes(candidateId);
      setNotes(response);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setNewNote(value);

    // Check for @mention
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const handleKeyDown = (e) => {
    if (showMentions && e.key === 'Enter') {
      e.preventDefault();
      if (filteredMentions.length > 0) {
        insertMention(filteredMentions[0]);
      }
    } else if (showMentions && e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = newNote.substring(0, mentionPosition);
    const textAfterCursor = newNote.substring(cursorPosition);
    
    const mentionText = `@${member.name}`;
    const newText = textBeforeCursor + mentionText + ' ' + textAfterCursor;
    
    setNewNote(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPosition = textBeforeCursor.length + mentionText.length + 1;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addCandidateNote(candidateId, newNote);
      setNewNote('');
      await fetchNotes();
      if (onAddNote) {
        onAddNote(newNote);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const filteredMentions = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNoteContent = (content) => {
    // Simple @mention highlighting
    return content.split(/(@\w+)/g).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="mention">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="notes-section">
      <form onSubmit={handleSubmit} className="note-form">
        <div className="note-input-container">
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a note... Use @ to mention team members"
            className="note-textarea"
            rows={3}
            disabled={loading}
          />
          
          {showMentions && (
            <div className="mentions-dropdown">
              {filteredMentions.length > 0 ? (
                filteredMentions.map((member) => (
                  <div
                    key={member.id}
                    className="mention-item"
                    onClick={() => insertMention(member)}
                  >
                    <div className="mention-name">{member.name}</div>
                    <div className="mention-role">{member.role}</div>
                  </div>
                ))
              ) : (
                <div className="mention-item no-results">
                  No team members found
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="note-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newNote.trim() || loading}
          >
            {loading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      <div className="notes-list">
        {Array.isArray(notes) && notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-header">
                <div className="note-author">
                  <div className="author-avatar">
                    {note.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-info">
                    <div className="author-name">{note.author}</div>
                    <div className="note-date">{formatDate(note.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div className="note-content">
                {renderNoteContent(note.content)}
              </div>
            </div>
          ))
        ) : (
          <div className="no-notes">
            <p>No notes yet. Add the first note above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesSection;
