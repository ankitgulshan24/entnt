// Jobs API service functions
import { fallbackJobs } from '../utils/fallbackData';

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
      return { data: fallbackJobs, pagination: { total: fallbackJobs.length, totalPages: 1, currentPage: 1 } };
    }
  }
  return response.json();
};

// Get jobs with pagination and filtering
export const getJobs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.experienceLevel) queryParams.append('experienceLevel', params.experienceLevel);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.sort) queryParams.append('sort', params.sort);
    
    console.log('Fetching jobs with params:', params);
    const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`);
    const data = await handleResponse(response);
    console.log('Jobs API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    console.warn('Using fallback data due to network error');
    
    // Implement pagination logic for fallback data
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get jobs from both fallback data and IndexedDB
    let allJobs = [...fallbackJobs];
    
    try {
      const { db } = await import('../utils/database');
      const dbJobs = await db.jobs.toArray();
      console.log(`Found ${dbJobs.length} jobs in IndexedDB`);
      
      // Merge database jobs with fallback jobs, avoiding duplicates
      const fallbackIds = new Set(fallbackJobs.map(job => job.id));
      const uniqueDbJobs = dbJobs.filter(job => !fallbackIds.has(job.id));
      allJobs = [...allJobs, ...uniqueDbJobs];
      
      console.log(`Total jobs for search: ${allJobs.length} (${fallbackJobs.length} fallback + ${uniqueDbJobs.length} from DB)`);
    } catch (dbError) {
      console.warn('Could not access IndexedDB for search, using fallback data only:', dbError);
    }
    
    // Apply basic filtering to all jobs
    let filteredJobs = [...allJobs];
    
    if (params.search) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(params.search.toLowerCase()) ||
        (job.tags && job.tags.some(tag => tag.toLowerCase().includes(params.search.toLowerCase())))
      );
    }
    
    if (params.status) {
      filteredJobs = filteredJobs.filter(job => job.status === params.status);
    }
    
    if (params.experienceLevel) {
      filteredJobs = filteredJobs.filter(job => job.experienceLevel === params.experienceLevel);
    }
    
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredJobs.length / pageSize);
    
    console.log(`Fallback pagination: page ${page}, showing ${paginatedJobs.length} of ${filteredJobs.length} jobs`);
    
    return { 
      data: paginatedJobs, 
      pagination: { 
        total: filteredJobs.length, 
        totalPages: totalPages, 
        currentPage: page,
        pageSize: pageSize
      } 
    };
  }
};

// Create a new job
export const createJob = async (jobData) => {
  try {
    console.log('Creating job:', jobData);
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Job created successfully:', data);
      return data;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error creating job via API:', error);
    console.warn('API failed, storing job locally in IndexedDB');
    
    // Store job locally in IndexedDB as fallback
    try {
      const { db } = await import('../utils/database');
      
      // Generate a simple numeric ID for IndexedDB compatibility
      const jobCount = await db.jobs.count();
      const newJobId = `job-${jobCount + 1}`;
      
      const newJob = {
        id: newJobId,
        title: jobData.title,
        slug: jobData.slug || jobData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: jobData.description || '',
        requirements: jobData.requirements || [],
        responsibilities: jobData.responsibilities || [],
        location: jobData.location || '',
        salary: jobData.salary || '',
        status: jobData.status || 'active',
        tags: jobData.tags || [],
        order: jobCount + 1,
        experienceLevel: jobData.experienceLevel || 'Experience',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.jobs.add(newJob);
      console.log('Job stored locally in IndexedDB:', newJob);
      
      return newJob;
    } catch (dbError) {
      console.error('Failed to store job locally:', dbError);
      // Final fallback - return optimistic update
      const fallbackJob = {
        ...jobData,
        id: `job-${fallbackJobs.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: fallbackJobs.length + 1,
        status: jobData.status || 'active',
        tags: jobData.tags || [],
        experienceLevel: jobData.experienceLevel || 'Experience'
      };
      return fallbackJob;
    }
  }
};

// Update an existing job
export const updateJob = async (jobId, updates) => {
  try {
    console.log('Updating job:', jobId, updates);
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      const data = await response.json();
      console.log('Job updated successfully:', data);
      return data;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating job via API:', error);
    console.warn('API failed, updating job locally in IndexedDB');
    
    // Update job locally in IndexedDB as fallback
    try {
      const { db } = await import('../utils/database');
      
      const updatedJob = {
        ...updates,
        updatedAt: new Date()
      };
      
      await db.jobs.update(jobId, updatedJob);
      console.log('Job updated locally in IndexedDB:', jobId, updatedJob);
      
      // Return the updated job
      const job = await db.jobs.get(jobId);
      return job;
    } catch (dbError) {
      console.error('Failed to update job locally:', dbError);
      // Final fallback - return optimistic update
      const fallbackJob = {
        ...updates,
        id: jobId,
        updatedAt: new Date().toISOString()
      };
      return fallbackJob;
    }
  }
};

// Archive/unarchive a job
export const toggleJobStatus = async (jobId, status) => {
  return updateJob(jobId, { status });
};

// Reorder jobs (with enhanced error handling for rollback testing)
export const reorderJobs = async (jobId, fromOrder, toOrder) => {
  try {
    console.log('Reordering jobs:', { jobId, fromOrder, toOrder });
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fromOrder, toOrder }),
    });
    const data = await handleResponse(response);
    console.log('Jobs reordered:', data);
    return data;
  } catch (error) {
    console.error('Error reordering jobs:', error);
    // Enhanced error handling for reorder operations
    if (error.message.includes('Reorder operation failed')) {
      throw new Error('Reorder failed - please retry. This simulates a rollback scenario.');
    }
    throw error;
  }
};

// Get available jobs for candidates (only active jobs)
export const getAvailableJobs = async (params = {}) => {
  return getJobs({ ...params, status: 'active' });
};

// Get job by ID
export const getJobById = async (jobId) => {
  try {
    console.log('Fetching job by ID:', jobId);
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    
    if (!response.ok) {
      console.error('Job API error:', response.status, response.statusText);
      // Try to find job in IndexedDB as fallback
      try {
        const { db } = await import('../utils/database');
        const dbJob = await db.jobs.get(jobId);
        if (dbJob) {
          console.log('Found job in IndexedDB:', dbJob);
          return dbJob;
        }
      } catch (dbError) {
        console.warn('Could not access IndexedDB:', dbError);
      }
      
      // Return a fallback job object
      const fallbackJob = fallbackJobs.find(j => j.id === jobId) || {
        id: jobId,
        title: 'Unknown Job',
        slug: 'unknown-job',
        status: 'active',
        tags: [],
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return fallbackJob;
    }
    
    const data = await response.json();
    console.log('Job fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    
    // Try to find job in IndexedDB as fallback
    try {
      const { db } = await import('../utils/database');
      const dbJob = await db.jobs.get(jobId);
      if (dbJob) {
        console.log('Found job in IndexedDB:', dbJob);
        return dbJob;
      }
    } catch (dbError) {
      console.warn('Could not access IndexedDB:', dbError);
    }
    
    // Return a fallback job object
    const fallbackJob = fallbackJobs.find(j => j.id === jobId) || {
      id: jobId,
      title: 'Unknown Job',
      slug: 'unknown-job',
      status: 'active',
      tags: [],
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return fallbackJob;
  }
};

// Delete a job
export const deleteJob = async (jobId) => {
  try {
    console.log('Deleting job:', jobId);
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });
    const data = await handleResponse(response);
    console.log('Job deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};
