// Applications API service functions
import { fallbackApplications } from '../utils/fallbackData';

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
      return fallbackApplications;
    }
  }
  return response.json();
};

// Apply for a job
export const applyForJob = async (jobId, candidateData) => {
  try {
    console.log('Applying for job:', jobId, candidateData);
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        candidateId: candidateData.id || `candidate-${Date.now()}`,
        candidateName: candidateData.name,
        candidateEmail: candidateData.email,
        appliedAt: new Date().toISOString()
      }),
    });
    const data = await handleResponse(response);
    console.log('Job application submitted:', data);
    return data;
  } catch (error) {
    console.error('Error applying for job:', error);
    throw error;
  }
};

// Get candidate applications
export const getCandidateApplications = async (candidateId) => {
  try {
    console.log('Fetching applications for candidate:', candidateId);
    const response = await fetch(`${API_BASE_URL}/applications/candidate/${candidateId}`);
    const data = await handleResponse(response);
    console.log('Candidate applications:', data);
    return data;
  } catch (error) {
    console.error('Error fetching candidate applications:', error);
    throw error;
  }
};

// Get all applications (for HR statistics)
export const getApplications = async () => {
  try {
    console.log('Fetching all applications...');
    const response = await fetch(`${API_BASE_URL}/applications`);
    
    if (!response.ok) {
      console.error('Applications API error:', response.status, response.statusText);
      // Return fallback data when API fails
      console.warn('Using fallback applications data');
      return fallbackApplications;
    }
    
    const data = await handleResponse(response);
    console.log('Applications API response:', data);
    
    // Ensure we return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    
    // Return fallback data when API fails
    console.warn('Using fallback applications data due to network error');
    return fallbackApplications;
  }
};

// Get job applications
export const getJobApplications = async (jobId) => {
  try {
    console.log('Fetching job applications for job:', jobId);
    const response = await fetch(`${API_BASE_URL}/applications/job/${jobId}`);
    
    if (!response.ok) {
      console.error('Job applications API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return [];
  }
};

// Get assignments for a job (HR view with scores)
export const getJobAssignments = async (jobId) => {
  try {
    console.log('Fetching job assignments for job:', jobId);
    const response = await fetch(`${API_BASE_URL}/assignments/job/${jobId}`);
    
    if (!response.ok) {
      console.error('Job assignments API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching job assignments:', error);
    return [];
  }
};

// Update application status
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    console.log('Updating application status:', { applicationId, status });
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    const data = await handleResponse(response);
    console.log('Application status updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Get assignments for candidate
export const getCandidateAssignments = async (candidateId) => {
  try {
    console.log('Fetching assignments for candidate:', candidateId);
    const response = await fetch(`${API_BASE_URL}/assignments/candidate/${candidateId}`);
    const data = await handleResponse(response);
    console.log('Candidate assignments:', data);
    return data;
  } catch (error) {
    console.error('Error fetching candidate assignments:', error);
    throw error;
  }
};

// Create assignment for candidate
export const createAssignment = async (assignmentData) => {
  try {
    console.log('Creating assignment:', assignmentData);
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignmentData),
    });
    const data = await handleResponse(response);
    console.log('Assignment created:', data);
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

// Submit assignment response
export const submitAssignmentResponse = async (assignmentId, responses) => {
  try {
    console.log('Submitting assignment response:', { assignmentId, responses });
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ responses }),
    });
    const data = await handleResponse(response);
    console.log('Assignment response submitted:', data);
    return data;
  } catch (error) {
    console.error('Error submitting assignment response:', error);
    throw error;
  }
};

// Get application by ID
export const getApplicationById = async (applicationId) => {
  try {
    console.log('Fetching application by ID:', applicationId);
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`);
    const data = await handleResponse(response);
    console.log('Application fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    throw error;
  }
};

// Delete application
export const deleteApplication = async (applicationId) => {
  try {
    console.log('Deleting application:', applicationId);
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: 'DELETE',
    });
    const data = await handleResponse(response);
    console.log('Application deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};


