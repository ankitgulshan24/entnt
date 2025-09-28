// Assessments API service functions
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
      return null;
    }
  }
  return response.json();
};

// Get assessment for a job
export const getAssessments = async (jobId) => {
  try {
    console.log('Fetching assessment for job:', jobId);
    const response = await fetch(`${API_BASE_URL}/assessments/${jobId}`);
    
    // Check if response is HTML (MSW not intercepting)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.warn('MSW not intercepting request, got HTML response. Using fallback.');
      return null; // Return null to trigger default assessment creation
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Assessment not found for job:', jobId);
        return null; // Return null for 404 (assessment not found)
      }
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    }
    
    const data = await response.json();
    console.log('Assessment fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    // If it's a JSON parse error (MSW not working), return null
    if (error.message.includes('Unexpected token')) {
      console.warn('MSW not working, returning null to trigger default assessment');
      return null;
    }
    throw error;
  }
};

// Create new assessment
export const createAssessment = async (jobId, assessmentData) => {
  try {
    console.log('Creating assessment for job:', jobId, assessmentData);
    const response = await fetch(`${API_BASE_URL}/assessments/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });
    const data = await handleResponse(response);
    console.log('Assessment created:', data);
    return data;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

// Update assessment
export const updateAssessment = async (jobId, assessmentData) => {
  try {
    console.log('Updating assessment for job:', jobId, assessmentData);
    const response = await fetch(`${API_BASE_URL}/assessments/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    });
    const data = await handleResponse(response);
    console.log('Assessment updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
};

// Delete assessment
export const deleteAssessment = async (assessmentId) => {
  try {
    console.log('Deleting assessment:', assessmentId);
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
    const data = await handleResponse(response);
    console.log('Assessment deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
};

// Submit assessment response (stores locally in IndexedDB)
export const submitAssessmentResponse = async (jobId, responseData) => {
  try {
    console.log('Submitting assessment response for job:', jobId, responseData);
    
    // Validate required fields
    if (!responseData.candidateId || !responseData.responses) {
      throw new Error('candidateId and responses are required');
    }
    
    const response = await fetch(`${API_BASE_URL}/assessments/${jobId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });
    const data = await handleResponse(response);
    console.log('Assessment response submitted:', data);
    return data;
  } catch (error) {
    console.error('Error submitting assessment response:', error);
    throw error;
  }
};

// Get assessment by ID
export const getAssessmentById = async (assessmentId) => {
  try {
    console.log('Fetching assessment by ID:', assessmentId);
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`);
    const data = await handleResponse(response);
    console.log('Assessment fetched by ID:', data);
    return data;
  } catch (error) {
    console.error('Error fetching assessment by ID:', error);
    throw error;
  }
};

// Get all assessments (for management)
export const getAllAssessments = async () => {
  try {
    console.log('Fetching all assessments');
    // This would need to be implemented in the backend
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching all assessments:', error);
    throw error;
  }
};


