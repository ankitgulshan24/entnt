// Candidates API service functions
import { fallbackCandidates } from '../utils/fallbackData';

const API_BASE_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    } catch (parseError) {
      console.error('Failed to parse error response as JSON:', parseError);
      // Return fallback data instead of throwing error
      console.warn('API request failed, using fallback data');
      return { data: fallbackCandidates, pagination: { total: fallbackCandidates.length, totalPages: 1, currentPage: 1 } };
    }
  }
  
  try {
    const data = await response.json();
    // Ensure data is not null or undefined
    if (data === null || data === undefined) {
      console.warn('API returned null/undefined data, using fallback');
      return { data: fallbackCandidates, pagination: { total: fallbackCandidates.length, totalPages: 1, currentPage: 1 } };
    }
    return data;
  } catch (parseError) {
    console.error('Failed to parse response as JSON:', parseError);
    console.warn('Using fallback data due to parse error');
    return { data: fallbackCandidates, pagination: { total: fallbackCandidates.length, totalPages: 1, currentPage: 1 } };
  }
};

// Get all candidates with pagination and filtering
export const getCandidates = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.stage && params.stage !== 'all') queryParams.append('stage', params.stage);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.sort) queryParams.append('sort', params.sort);
    
    const response = await fetch(`${API_BASE_URL}/candidates?${queryParams}`);
    
    if (!response.ok) {
      console.error('Candidates API error:', response.status, response.statusText);
      // Return fallback data when API fails
      console.warn('Using fallback candidates data');
      return {
        data: fallbackCandidates,
        pagination: { total: fallbackCandidates.length, totalPages: 1, currentPage: 1 }
      };
    }
    
    const data = await response.json();
    
    // Ensure we return a consistent structure
    if (data && typeof data === 'object') {
      return {
        data: Array.isArray(data.data) ? data.data : [],
        pagination: data.pagination || { total: 0, totalPages: 0, currentPage: 1 }
      };
    } else {
      // Fallback for unexpected response format
      return {
        data: Array.isArray(data) ? data : [],
        pagination: { total: 0, totalPages: 0, currentPage: 1 }
      };
    }
  } catch (error) {
    console.error('Error fetching candidates:', error);
    
    // Return fallback data when API fails
    console.warn('Using fallback candidates data due to network error');
    return {
      data: fallbackCandidates,
      pagination: { total: fallbackCandidates.length, totalPages: 1, currentPage: 1 }
    };
  }
};

// Get single candidate
export const getCandidate = async (candidateId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`);
    
    if (!response.ok) {
      console.error('Candidate API error:', response.status, response.statusText);
      // Return a fallback candidate object
      const fallbackCandidate = fallbackCandidates.find(c => c.id === candidateId) || {
        id: candidateId,
        name: 'Unknown Candidate',
        email: 'unknown@example.com',
        stage: 'applied',
        jobId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return fallbackCandidate;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching candidate:', error);
    // Return a fallback candidate object
    const fallbackCandidate = fallbackCandidates.find(c => c.id === candidateId) || {
      id: candidateId,
      name: 'Unknown Candidate',
      email: 'unknown@example.com',
      stage: 'applied',
      jobId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return fallbackCandidate;
  }
};

// Create a new candidate
export const createCandidate = async (candidateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(candidateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create candidate');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating candidate:', error);
    // Return a fallback candidate if API fails
    const fallbackCandidate = {
      id: `candidate-${Date.now()}`,
      name: candidateData.name,
      email: candidateData.email,
      stage: candidateData.stage || 'applied',
      jobId: candidateData.jobId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return fallbackCandidate;
  }
};

// Update candidate stage (with validation)
export const updateCandidateStage = async (candidateId, stage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stage }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update candidate stage');
    }
    
    const data = await response.json();
    
    // Persist to localStorage for offline persistence
    persistCandidateStageChange(candidateId, stage);
    
    return data;
  } catch (error) {
    console.error('Error updating candidate stage:', error);
    console.warn('Stage update failed, but persisting locally for offline support');
    
    // Persist to localStorage even when API fails
    persistCandidateStageChange(candidateId, stage);
    
    // Return optimistic update
    return { id: candidateId, stage, updatedAt: new Date().toISOString() };
  }
};

// Persist candidate stage changes to localStorage
const persistCandidateStageChange = (candidateId, stage) => {
  try {
    const key = `candidate_stage_${candidateId}`;
    const stageData = {
      candidateId,
      stage,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(stageData));
  } catch (error) {
    console.error('Failed to persist candidate stage change:', error);
  }
};

// Get persisted candidate stage changes from localStorage
export const getPersistedStageChanges = () => {
  try {
    const changes = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('candidate_stage_')) {
        const candidateId = key.replace('candidate_stage_', '');
        const stageData = JSON.parse(localStorage.getItem(key));
        changes[candidateId] = stageData.stage;
      }
    }
    return changes;
  } catch (error) {
    console.error('Failed to get persisted stage changes:', error);
    return {};
  }
};

// Get candidate timeline
export const getCandidateTimeline = async (candidateId) => {
  try {
    console.log('Fetching candidate timeline:', candidateId);
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/timeline`);
    
    if (!response.ok) {
      console.error('Timeline API error:', response.status, response.statusText);
      // Return fallback data when API fails
      console.warn('Using fallback timeline data');
      return [];
    }
    
    const data = await response.json();
    console.log('Timeline API response:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching candidate timeline:', error);
    console.warn('Using fallback timeline data due to network error');
    return [];
  }
};

// Get candidate notes
export const getCandidateNotes = async (candidateId) => {
  try {
    console.log('Fetching candidate notes:', candidateId);
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/notes`);
    
    if (!response.ok) {
      console.error('Notes API error:', response.status, response.statusText);
      // Return fallback data when API fails
      console.warn('Using fallback notes data');
      return [];
    }
    
    const data = await response.json();
    console.log('Notes API response:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching candidate notes:', error);
    console.warn('Using fallback notes data due to network error');
    return [];
  }
};

// Add candidate note
export const addCandidateNote = async (noteData) => {
  try {
    console.log('Adding candidate note:', noteData);
    const response = await fetch(`${API_BASE_URL}/candidates/${noteData.candidateId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    const data = await handleResponse(response);
    console.log('Note added:', data);
    
    // Persist to localStorage for offline persistence
    persistCandidateNote(noteData);
    
    return data;
  } catch (error) {
    console.error('Error adding candidate note:', error);
    console.warn('Note addition failed, but persisting locally for offline support');
    
    // Persist to localStorage even when API fails
    persistCandidateNote(noteData);
    
    // Return optimistic update
    return { 
      id: Date.now(), 
      ...noteData, 
      createdAt: new Date().toISOString() 
    };
  }
};

// Persist candidate note to localStorage
const persistCandidateNote = (noteData) => {
  try {
    const key = `candidate_note_${noteData.candidateId}_${Date.now()}`;
    const note = {
      ...noteData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(note));
    console.log('Candidate note persisted locally:', note);
  } catch (error) {
    console.error('Failed to persist candidate note:', error);
  }
};

// Update candidate (general update)
export const updateCandidate = async (candidateId, updates) => {
  try {
    console.log('Updating candidate:', { candidateId, updates });
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await handleResponse(response);
    console.log('Candidate updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
};

// Delete candidate
export const deleteCandidate = async (candidateId) => {
  try {
    console.log('Deleting candidate:', candidateId);
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'DELETE',
    });
    const data = await handleResponse(response);
    console.log('Candidate deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting candidate:', error);
    throw error;
  }
};


