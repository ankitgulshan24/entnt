import { http, HttpResponse } from 'msw';
import { db, initializeDB } from '../utils/database';

// Helper function to ensure database is ready
const ensureDatabaseReady = async () => {
  if (!db.isOpen()) {
    console.log('MSW: Database not open, initializing...');
    await initializeDB();
  }
};

// Helper function to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to simulate random errors
const shouldError = () => Math.random() < 0.05; // 5% error rate

// Helper function to get random delay
const getRandomDelay = () => Math.floor(Math.random() * 1000) + 200; // 200-1200ms

export const handlers = [
  // Test endpoint to verify database connectivity
  http.get('/api/test-db', async () => {
    try {
      await ensureDatabaseReady();
      const candidateCount = await db.candidates.count();
      const jobCount = await db.jobs.count();
      
      return HttpResponse.json({
        message: 'Database test successful',
        candidateCount,
        jobCount,
        dbOpen: db.isOpen()
      });
    } catch (error) {
      console.error('Database test failed:', error);
      return HttpResponse.json(
        { error: 'Database test failed', details: error.message },
        { status: 500 }
      );
    }
  }),

  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const experienceLevel = url.searchParams.get('experienceLevel') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;
    const sort = url.searchParams.get('sort') || 'order';

    try {
      let jobs = await db.jobs.toArray();
      console.log(`Total jobs in database: ${jobs.length}`);
      
      // Apply filters
      if (search) {
        console.log(`Searching for: "${search}"`);
        const originalCount = jobs.length;
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          (job.tags && job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
        );
        console.log(`Search results: ${jobs.length} jobs found (from ${originalCount} total)`);
      }
      
      if (status) {
        jobs = jobs.filter(job => job.status === status);
      }
      
      if (experienceLevel) {
        jobs = jobs.filter(job => job.experienceLevel === experienceLevel);
      }
      
      console.log(`Jobs after filtering: ${jobs.length}`);
      
      // Apply sorting
      if (sort === 'title') {
        jobs.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === 'createdAt') {
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        jobs.sort((a, b) => a.order - b.order);
      }
      
      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedJobs = jobs.slice(startIndex, endIndex);
      
      const paginationData = {
        page,
        pageSize,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / pageSize),
        currentPage: page
      };
      
      console.log('Pagination data:', paginationData);
      console.log(`Returning ${paginatedJobs.length} jobs for page ${page}`);
      
      return HttpResponse.json({
        data: paginatedJobs,
        pagination: paginationData
      });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }
  }),

  http.post('/api/jobs', async ({ request }) => {
    await delay(getRandomDelay());
    
    // Reduced error rate for job creation to make it more reliable
    if (Math.random() < 0.02) { // Only 2% error rate for job creation
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobData = await request.json();
      
      // Validate required fields
      if (!jobData.title) {
        return HttpResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }
      
      // Check for unique slug
      const existingJob = await db.jobs.where('slug').equals(jobData.slug).first();
      if (existingJob) {
        return HttpResponse.json(
          { error: 'Slug must be unique' },
          { status: 400 }
        );
      }
      
      // Generate a simple numeric ID for IndexedDB compatibility
      const jobCount = await db.jobs.count();
      const newJobId = `job-${jobCount + 1}`;
      
      const newJob = {
        id: newJobId,
        title: jobData.title,
        slug: jobData.slug || jobData.title.toLowerCase().replace(/\s+/g, '-'),
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
      
      return HttpResponse.json(newJob, { status: 201 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }
  }),

  // Get job by ID
  http.get('/api/jobs/:id', async ({ params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.id; // Keep as string since job IDs are strings like "job-1234567890"
      console.log('Fetching job by ID:', jobId);
      const job = await db.jobs.get(jobId);
      console.log('Job found:', job);
      
      if (!job) {
        console.log('Job not found in database');
        return HttpResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return HttpResponse.json(job);
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      return HttpResponse.json(
        { error: 'Failed to fetch job' },
        { status: 500 }
      );
    }
  }),

  http.patch('/api/jobs/:id', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const updates = await request.json();
      const jobId = params.id;
      
      const updatedJob = {
        ...updates,
        updatedAt: new Date()
      };
      
      await db.jobs.update(jobId, updatedJob);
      
      const job = await db.jobs.get(jobId);
      if (!job) {
        return HttpResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return HttpResponse.json(job);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      );
    }
  }),

  http.patch('/api/jobs/:id/reorder', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    // Enhanced error simulation for reorder endpoint (occasionally return 500 to test rollback)
    const shouldReorderError = () => Math.random() < 0.3; // 30% error rate for reorder
    
    if (shouldReorderError()) {
      return HttpResponse.json(
        { error: 'Reorder operation failed - please retry' },
        { status: 500 }
      );
    }

    try {
      const { fromOrder, toOrder } = await request.json();
      const jobId = params.id;
      
      // Validate input
      if (typeof fromOrder !== 'number' || typeof toOrder !== 'number') {
        return HttpResponse.json(
          { error: 'fromOrder and toOrder must be numbers' },
          { status: 400 }
        );
      }
      
      // Get all jobs and reorder them
      const jobs = await db.jobs.toArray();
      const job = jobs.find(j => j.id === jobId);
      
      if (!job) {
        return HttpResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      // Update orders
      jobs.forEach(j => {
        if (j.order === fromOrder) {
          j.order = toOrder;
        } else if (fromOrder < toOrder && j.order > fromOrder && j.order <= toOrder) {
          j.order -= 1;
        } else if (fromOrder > toOrder && j.order < fromOrder && j.order >= toOrder) {
          j.order += 1;
        }
      });
      
      // Save all changes
      await db.jobs.bulkPut(jobs);
      
      return HttpResponse.json({ 
        success: true, 
        message: 'Jobs reordered successfully',
        fromOrder,
        toOrder
      });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to reorder jobs' },
        { status: 500 }
      );
    }
  }),

  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    await delay(getRandomDelay());
    
    // Ensure database is ready
    await ensureDatabaseReady();
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const stage = url.searchParams.get('stage') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;

    try {
      let candidates = await db.candidates.toArray();
      
      // Apply filters
      if (search) {
        candidates = candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(search.toLowerCase()) ||
          candidate.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (stage) {
        candidates = candidates.filter(candidate => candidate.stage === stage);
      }
      
      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCandidates = candidates.slice(startIndex, endIndex);
      
      return HttpResponse.json({
        data: paginatedCandidates,
        pagination: {
          page,
          pageSize,
          total: candidates.length,
          totalPages: Math.ceil(candidates.length / pageSize),
          currentPage: page
        }
      });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      );
    }
  }),

  http.post('/api/candidates', async ({ request }) => {
    await delay(getRandomDelay());
    
    // Ensure database is ready
    await ensureDatabaseReady();
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const candidateData = await request.json();
      
      // Validate required fields
      if (!candidateData.name || !candidateData.email) {
        return HttpResponse.json(
          { error: 'Name and email are required' },
          { status: 400 }
        );
      }
      
      // Validate stage
      const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
      if (candidateData.stage && !validStages.includes(candidateData.stage)) {
        return HttpResponse.json(
          { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
          { status: 400 }
        );
      }
      
      const newCandidate = {
        id: `candidate-${Date.now()}`,
        name: candidateData.name,
        email: candidateData.email,
        stage: candidateData.stage || 'applied',
        jobId: candidateData.jobId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add candidate to database
      await db.candidates.add(newCandidate);
      
      return HttpResponse.json(newCandidate, { status: 201 });
    } catch (error) {
      console.error('MSW: Error creating candidate:', error);
      return HttpResponse.json(
        { error: 'Failed to create candidate' },
        { status: 500 }
      );
    }
  }),

  http.patch('/api/candidates/:id', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    // Ensure database is ready
    await ensureDatabaseReady();
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const updates = await request.json();
      const candidateId = params.id;
      
      // Validate stage transitions
      const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
      if (updates.stage && !validStages.includes(updates.stage)) {
        return HttpResponse.json(
          { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
          { status: 400 }
        );
      }
      
      // Get current candidate to validate transitions
      const currentCandidate = await db.candidates.get(candidateId);
      if (!currentCandidate) {
        return HttpResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
      
      const updatedCandidate = {
        ...updates,
        updatedAt: new Date()
      };
      
      await db.candidates.update(candidateId, updatedCandidate);
      
      const candidate = await db.candidates.get(candidateId);
      
      // Add timeline entry for stage changes
      if (updates.stage && updates.stage !== currentCandidate.stage) {
        const timelineEntry = {
          id: `timeline-${Date.now()}`,
          candidateId: candidateId,
          stage: updates.stage,
          notes: `Stage changed from ${currentCandidate.stage} to ${updates.stage}`,
          timestamp: new Date()
        };
        
        await db.candidateTimeline.add(timelineEntry);
      }
      
      return HttpResponse.json(candidate);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to update candidate' },
        { status: 500 }
      );
    }
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const candidateId = params.id;
      const timeline = await db.candidateTimeline.where('candidateId').equals(candidateId).toArray();
      
      return HttpResponse.json(timeline);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch timeline' },
        { status: 500 }
      );
    }
  }),

  http.get('/api/candidates/:id/notes', async ({ params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const candidateId = params.id;
      const notes = await db.notes
        .where('candidateId')
        .equals(candidateId)
        .toArray();
      
      return HttpResponse.json(notes);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }
  }),

  http.post('/api/candidates/:id/notes', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const noteData = await request.json();
      const candidateId = params.id;
      
      const newNote = {
        id: Date.now(),
        candidateId: candidateId,
        content: noteData.content,
        author: noteData.author || 'Unknown',
        createdAt: new Date().toISOString()
      };
      
      await db.notes.add(newNote);
      
      return HttpResponse.json(newNote, { status: 201 });
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to add note' },
        { status: 500 }
      );
    }
  }),

  // Applications endpoints
  http.get('/api/applications', async () => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const applications = await db.applications.toArray();
      return HttpResponse.json(applications);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }
  }),

  http.get('/api/applications/job/:jobId', async ({ params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      const applications = await db.applications.where('jobId').equals(jobId).toArray();
      
      return HttpResponse.json(applications);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to fetch job applications' },
        { status: 500 }
      );
    }
  }),

  // Test handler to check if MSW is working
  http.get('/api/test', () => {
    console.log('MSW: Test endpoint called - MSW is working!');
    return HttpResponse.json({ message: 'MSW is working!' });
  }),

  // Assessment handlers
  http.get('/api/assessments/:jobId', async ({ params }) => {
    console.log('MSW: Assessment handler called with params:', params);
    await delay(getRandomDelay());
    
    if (shouldError()) {
      console.log('MSW: Assessment handler returning error');
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      console.log('MSW: Fetching assessment for job:', jobId);
      
      // Check if jobId needs to be converted to proper format
      const properJobId = jobId && !jobId.startsWith('job-') ? `job-${jobId}` : jobId;
      console.log('MSW: Using properJobId:', properJobId);
      
      const assessment = await db.assessments.where('jobId').equals(properJobId).first();
      console.log('MSW: Assessment query result:', assessment);
      
      if (!assessment) {
        console.log('MSW: Assessment not found, returning 404');
        return HttpResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        );
      }
      
      console.log('MSW: Assessment found, returning:', assessment);
      return HttpResponse.json(assessment);
    } catch (error) {
      console.error('MSW: Error fetching assessment:', error);
      return HttpResponse.json(
        { error: 'Failed to fetch assessment' },
        { status: 500 }
      );
    }
  }),

  http.post('/api/assessments/:jobId', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      const assessmentData = await request.json();
      
      // Check if assessment already exists
      const existingAssessment = await db.assessments.where('jobId').equals(jobId).first();
      if (existingAssessment) {
        return HttpResponse.json(
          { error: 'Assessment already exists for this job' },
          { status: 400 }
        );
      }
      
      const newAssessment = {
        id: `assessment-${Date.now()}`,
        jobId: jobId,
        title: assessmentData.title || 'Job Assessment',
        sections: assessmentData.sections || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.assessments.add(newAssessment);
      console.log('Assessment created:', newAssessment);
      
      return HttpResponse.json(newAssessment, { status: 201 });
    } catch (error) {
      console.error('Error creating assessment:', error);
      return HttpResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      );
    }
  }),

  http.put('/api/assessments/:jobId', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      const assessmentData = await request.json();
      
      const existingAssessment = await db.assessments.where('jobId').equals(jobId).first();
      if (!existingAssessment) {
        return HttpResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        );
      }
      
      const updatedAssessment = {
        ...assessmentData,
        updatedAt: new Date()
      };
      
      await db.assessments.update(existingAssessment.id, updatedAssessment);
      console.log('Assessment updated:', updatedAssessment);
      
      return HttpResponse.json(updatedAssessment);
    } catch (error) {
      console.error('Error updating assessment:', error);
      return HttpResponse.json(
        { error: 'Failed to update assessment' },
        { status: 500 }
      );
    }
  }),

  http.delete('/api/assessments/:jobId', async ({ params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      const assessment = await db.assessments.where('jobId').equals(jobId).first();
      
      if (!assessment) {
        return HttpResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        );
      }
      
      await db.assessments.delete(assessment.id);
      console.log('Assessment deleted:', assessment.id);
      
      return HttpResponse.json({ message: 'Assessment deleted successfully' });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      return HttpResponse.json(
        { error: 'Failed to delete assessment' },
        { status: 500 }
      );
    }
  }),

  http.post('/api/assessments/:jobId/submit', async ({ request, params }) => {
    await delay(getRandomDelay());
    
    if (shouldError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
      const jobId = params.jobId;
      const responseData = await request.json();
      
      // Validate required fields
      if (!responseData.candidateId || !responseData.responses) {
        return HttpResponse.json(
          { error: 'candidateId and responses are required' },
          { status: 400 }
        );
      }
      
      const newResponse = {
        id: `response-${Date.now()}`,
        candidateId: responseData.candidateId,
        assessmentId: jobId,
        responses: responseData.responses,
        submittedAt: new Date()
      };
      
      await db.candidateResponses.add(newResponse);
      console.log('Assessment response submitted:', newResponse);
      
      return HttpResponse.json(newResponse, { status: 201 });
    } catch (error) {
      console.error('Error submitting assessment response:', error);
      return HttpResponse.json(
        { error: 'Failed to submit assessment response' },
        { status: 500 }
      );
    }
  })
];