import Dexie from 'dexie';

// Initialize Dexie database
const db = new Dexie('TalentFlowDB_v2');

// Define database schema - single version with all tables
db.version(1).stores({
  jobs: 'id, title, slug, status, tags, order, experienceLevel, createdAt, updatedAt',
  candidates: 'id, name, email, stage, jobId, createdAt, updatedAt',
  assessments: 'id, jobId, title, sections, createdAt, updatedAt',
  candidateResponses: 'id, candidateId, assessmentId, responses, submittedAt',
  candidateTimeline: 'id, candidateId, stage, notes, timestamp',
  notes: 'id, candidateId, content, author, createdAt',
  applications: 'id, jobId, candidateId, candidateName, candidateEmail, status, appliedAt, updatedAt',
  assignments: 'id, jobId, candidateId, assessmentId, status, validUntil, createdAt, submittedAt'
});

// Clear database and reseed
export const clearAndReseedDB = async () => {
  try {
    if (db.isOpen()) {
      await db.close();
    }
    
    await db.open();
    console.log('Clearing database...');
    
    // Clear all tables
    await db.jobs.clear();
    await db.candidates.clear();
    await db.assessments.clear();
    await db.candidateResponses.clear();
    await db.candidateTimeline.clear();
    await db.notes.clear();
    await db.applications.clear();
    await db.assignments.clear();
    
    console.log('Database cleared, reseeding...');
    await seedDatabase();
    console.log('Database reseeded successfully');
  } catch (error) {
    console.error('Failed to clear and reseed database:', error);
    throw error;
  }
};

// Initialize database and seed data
export const initializeDB = async () => {
  try {
    // Close any existing connection first
    if (db.isOpen()) {
      await db.close();
    }
    
    await db.open();
    console.log('Database opened successfully');
    
    // Check if data already exists
    const jobCount = await db.jobs.count();
    console.log(`Current job count in database: ${jobCount}`);
    
    // Force re-seed if we have less than 100 jobs (should be 150+)
    if (jobCount < 100) {
      console.log('Clearing existing data and re-seeding database...');
      await db.jobs.clear();
      await db.candidates.clear();
      await db.applications.clear();
      await db.assessments.clear();
      await db.assignments.clear();
      await seedDatabase();
    } else {
      console.log(`Database already seeded with ${jobCount} jobs`);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Try to close and reopen
    try {
      if (db.isOpen()) {
        await db.close();
      }
      await db.open();
      console.log('Database reopened after error');
    } catch (retryError) {
      console.error('Failed to reopen database:', retryError);
      throw retryError;
    }
  }
};

// Seed database with initial data
const seedDatabase = async () => {
  try {
    // Seed jobs
    const jobs = generateJobs();
    console.log(`Generated ${jobs.length} jobs`);
    await db.jobs.bulkAdd(jobs);
    
    // Seed candidates
    const candidates = generateCandidates(jobs);
    console.log(`Generated ${candidates.length} candidates`);
    await db.candidates.bulkAdd(candidates);
    
    // Seed assessments
    const assessments = generateAssessments(jobs);
    console.log(`Generated ${assessments.length} assessments`);
    await db.assessments.bulkAdd(assessments);
    
    // Seed sample applications and assignments
    const applications = generateApplications(jobs);
    console.log(`Generated ${applications.length} applications`);
    await db.applications.bulkAdd(applications);
    
    const assignments = generateAssignments(applications, assessments);
    console.log(`Generated ${assignments.length} assignments`);
    await db.assignments.bulkAdd(assignments);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
};

// Higher-order function to categorize jobs by experience level
const categorizeJobByExperience = (jobTitle) => {
  const fresherKeywords = [
    'junior', 'entry', 'intern', 'trainee', 'associate', 'assistant', 'fresher',
    'graduate', 'new', 'starter', 'beginner', 'apprentice', 'support'
  ];
  
  const experienceKeywords = [
    'senior', 'lead', 'principal', 'architect', 'director', 'manager', 'head',
    'chief', 'expert', 'specialist', 'consultant', 'advisor', 'strategist'
  ];
  
  const titleLower = jobTitle.toLowerCase();
  
  // Check for experience keywords first (higher priority)
  if (experienceKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'Experience';
  }
  
  // Check for fresher keywords
  if (fresherKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'Fresher';
  }
  
  // Default categorization based on common patterns
  if (titleLower.includes('engineer') || titleLower.includes('developer') || 
      titleLower.includes('analyst') || titleLower.includes('specialist')) {
    // Random assignment for technical roles (60% experience, 40% fresher)
    return Math.random() > 0.4 ? 'Experience' : 'Fresher';
  }
  
  // For management and senior roles, default to Experience
  if (titleLower.includes('manager') || titleLower.includes('lead') || 
      titleLower.includes('director') || titleLower.includes('head')) {
    return 'Experience';
  }
  
  // Default to Experience for other roles
  return 'Experience';
};

// Generate sample jobs
const generateJobs = () => {
  const jobTitles = [
    'Senior Frontend Developer',
    'Full Stack Engineer',
    'React Developer',
    'Node.js Developer',
    'Python Developer',
    'Junior Frontend Developer',
    'Entry Level Software Engineer',
    'Graduate Developer',
    'Intern Software Engineer',
    'Junior Python Developer',
    'DevOps Engineer',
    'UI/UX Designer',
    'Product Manager',
    'Data Scientist',
    'Backend Developer',
    'Mobile App Developer',
    'QA Engineer',
    'Technical Lead',
    'Junior QA Engineer',
    'Entry Level Mobile Developer',
    'Graduate Data Analyst',
    'Software Architect',
    'Cloud Engineer',
    'Machine Learning Engineer',
    'Cybersecurity Specialist',
    'Database Administrator',
    'System Administrator',
    'Business Analyst',
    'Marketing Manager',
    'Sales Representative',
    'Customer Success Manager',
    'Content Writer',
    'Graphic Designer',
    'Senior React Developer',
    'Vue.js Developer',
    'Angular Developer',
    'TypeScript Developer',
    'Java Developer',
    'C# Developer',
    'Go Developer',
    'Rust Developer',
    'PHP Developer',
    'Ruby Developer',
    'iOS Developer',
    'Android Developer',
    'Flutter Developer',
    'React Native Developer',
    'Frontend Architect',
    'Backend Architect',
    'Solution Architect',
    'Enterprise Architect',
    'Security Engineer',
    'Network Engineer',
    'Infrastructure Engineer',
    'Platform Engineer',
    'Site Reliability Engineer',
    'Performance Engineer',
    'Automation Engineer',
    'Test Automation Engineer',
    'Manual QA Tester',
    'Performance Tester',
    'Security Tester',
    'UX Researcher',
    'Product Designer',
    'Visual Designer',
    'Interaction Designer',
    'Design System Lead',
    'Creative Director',
    'Art Director',
    'Brand Manager',
    'Digital Marketing Specialist',
    'SEO Specialist',
    'Social Media Manager',
    'Content Marketing Manager',
    'Email Marketing Specialist',
    'PPC Specialist',
    'Analytics Manager',
    'Growth Hacker',
    'Sales Manager',
    'Account Executive',
    'Business Development Manager',
    'Partnership Manager',
    'Operations Manager',
    'Project Manager',
    'Scrum Master',
    'Agile Coach',
    'Technical Writer',
    'Documentation Specialist',
    'Training Specialist',
    'HR Business Partner',
    'Talent Acquisition Specialist',
    'Recruiter',
    'Compensation Analyst',
    'Benefits Administrator',
    'Employee Relations Specialist',
    'Learning & Development Manager',
    'Organizational Development Specialist',
    'Finance Manager',
    'Financial Analyst',
    'Accounting Manager',
    'Controller',
    'CFO',
    'Legal Counsel',
    'Compliance Officer',
    'Risk Manager',
    'Internal Auditor',
    'Procurement Manager',
    'Vendor Manager',
    'Supply Chain Manager',
    'Logistics Coordinator',
    'Facilities Manager',
    'IT Support Specialist',
    'Help Desk Technician',
    'Desktop Support Engineer',
    'Network Administrator',
    'Database Developer',
    'ETL Developer',
    'Data Engineer',
    'Data Analyst',
    'Business Intelligence Analyst',
    'Machine Learning Engineer',
    'AI Research Scientist',
    'Computer Vision Engineer',
    'NLP Engineer',
    'Robotics Engineer',
    'Blockchain Developer',
    'Smart Contract Developer',
    'Web3 Developer',
    'Game Developer',
    'Unity Developer',
    'Unreal Engine Developer',
    'AR/VR Developer',
    'IoT Developer',
    'Embedded Systems Engineer',
    'Firmware Engineer',
    'Hardware Engineer',
    'Electrical Engineer',
    'Mechanical Engineer',
    'Civil Engineer',
    'Chemical Engineer',
    'Biomedical Engineer',
    'Environmental Engineer',
    'Aerospace Engineer',
    'Nuclear Engineer',
    'Petroleum Engineer',
    'Mining Engineer',
    'Industrial Engineer',
    'Manufacturing Engineer',
    'Quality Engineer',
    'Process Engineer',
    'Research Scientist',
    'Laboratory Technician',
    'Clinical Research Associate',
    'Regulatory Affairs Specialist',
    'Medical Writer',
    'Pharmacist',
    'Nurse Practitioner',
    'Physician Assistant',
    'Physical Therapist',
    'Occupational Therapist',
    'Speech Therapist',
    'Psychologist',
    'Social Worker',
    'Counselor',
    'Therapist',
    'Case Manager',
    'Healthcare Administrator',
    'Hospital Administrator',
    'Clinic Manager',
    'Medical Office Manager',
    'Insurance Specialist',
    'Claims Adjuster',
    'Underwriter',
    'Actuary',
    'Investment Analyst',
    'Portfolio Manager',
    'Financial Advisor',
    'Wealth Manager',
    'Banking Officer',
    'Credit Analyst',
    'Loan Officer',
    'Mortgage Broker',
    'Real Estate Agent',
    'Property Manager',
    'Real Estate Developer',
    'Construction Manager',
    'Architect',
    'Interior Designer',
    'Landscape Architect',
    'Urban Planner',
    'Surveyor',
    'Geologist',
    'Meteorologist',
    'Oceanographer',
    'Astronomer',
    'Physicist',
    'Chemist',
    'Biologist',
    'Microbiologist',
    'Geneticist',
    'Botanist',
    'Zoologist',
    'Ecologist',
    'Environmental Scientist',
    'Conservation Scientist',
    'Forester',
    'Agricultural Scientist',
    'Food Scientist',
    'Nutritionist',
    'Dietitian',
    'Chef',
    'Restaurant Manager',
    'Food Service Manager',
    'Catering Manager',
    'Event Planner',
    'Wedding Planner',
    'Travel Agent',
    'Tour Guide',
    'Hotel Manager',
    'Resort Manager',
    'Cruise Director',
    'Flight Attendant',
    'Pilot',
    'Air Traffic Controller',
    'Airport Manager',
    'Transportation Manager',
    'Logistics Coordinator',
    'Warehouse Manager',
    'Inventory Manager',
    'Purchasing Manager',
    'Procurement Specialist',
    'Contract Specialist',
    'Vendor Relations Manager',
    'Supplier Quality Engineer',
    'Materials Manager',
    'Production Manager',
    'Manufacturing Supervisor',
    'Plant Manager',
    'Operations Director',
    'Chief Operating Officer',
    'Chief Executive Officer',
    'Chief Technology Officer',
    'Chief Financial Officer',
    'Chief Marketing Officer',
    'Chief Human Resources Officer',
    'Chief Information Officer',
    'Chief Security Officer',
    'Chief Data Officer',
    'Chief Product Officer',
    'Chief Revenue Officer',
    'Chief Strategy Officer',
    'Chief Innovation Officer',
    'Chief Digital Officer',
    'Chief Customer Officer',
    'Chief Sustainability Officer',
    'Chief Diversity Officer',
    'Chief Legal Officer',
    'General Counsel',
    'Corporate Secretary',
    'Board Member',
    'Advisor',
    'Consultant',
    'Freelancer',
    'Contractor',
    'Intern',
    'Entry Level',
    'Junior',
    'Mid Level',
    'Senior',
    'Lead',
    'Principal',
    'Staff',
    'Distinguished',
    'Fellow',
    'Director',
    'VP',
    'SVP',
    'EVP',
    'President',
    'Founder',
    'Co-Founder',
    'CEO',
    'CTO',
    'CFO',
    'COO',
    'CMO',
    'CHRO',
    'CIO',
    'CSO',
    'CDO',
    'CPO',
    'CRO',
    'CSO',
    'CINO',
    'CDO',
    'CCO',
    'CSO',
    'CDO',
    'CLO'
  ];

  const tags = [
    'React', 'JavaScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes',
    'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'TypeScript', 'Vue.js',
    'Angular', 'Express', 'Django', 'Flask', 'FastAPI', 'Terraform',
    'Jenkins', 'GitLab', 'GitHub', 'Jira', 'Confluence', 'Figma', 'Sketch'
  ];

  return jobTitles.map((title, index) => ({
    id: `job-${index + 1}`,
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    status: Math.random() > 0.3 ? 'active' : 'archived',
    tags: tags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 2),
    order: index + 1,
    experienceLevel: categorizeJobByExperience(title),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }));
};

// Generate sample candidates
const generateCandidates = (jobs) => {
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
    'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel',
    'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen', 'Mark', 'Betty', 'Donald',
    'Helen', 'Steven', 'Sandra', 'Paul', 'Donna', 'Andrew', 'Carol', 'Joshua',
    'Ruth', 'Kenneth', 'Sharon', 'Kevin', 'Michelle', 'Brian', 'Laura', 'George',
    'Sarah', 'Edward', 'Kimberly', 'Ronald', 'Deborah', 'Timothy', 'Dorothy'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

  const candidates = [];
  
  for (let i = 0; i < 2000; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    
    candidates.push({
      id: `candidate-${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      stage: stages[Math.floor(Math.random() * stages.length)],
      jobId: job.id,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }

  return candidates;
};

// Generate sample assessments
const generateAssessments = (jobs) => {
  const questionTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'];
  
  return jobs.map((job, index) => ({
    id: `assessment-${index + 1}`,
    jobId: job.id,
    title: `${job.title} Assessment`,
    sections: [
      {
        id: `section-${index + 1}-1`,
        title: 'Technical Skills',
        questions: generateQuestions(5, questionTypes)
      },
      {
        id: `section-${index + 1}-2`,
        title: 'Experience & Background',
        questions: generateQuestions(3, questionTypes)
      },
      {
        id: `section-${index + 1}-3`,
        title: 'Problem Solving',
        questions: generateQuestions(2, questionTypes)
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

// Generate questions for assessments
const generateQuestions = (count, questionTypes) => {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const question = {
      id: `question-${Date.now()}-${i}`,
      type,
      title: `Sample ${type.replace('-', ' ')} question ${i + 1}`,
      required: Math.random() > 0.3,
      order: i + 1,
      marks: Math.floor(Math.random() * 5) + 1
    };

    if (type === 'single-choice' || type === 'multi-choice') {
      question.options = [
        'Option 1',
        'Option 2',
        'Option 3',
        'Option 4'
      ];
      if (type === 'single-choice') {
        question.correctAnswer = question.options[Math.floor(Math.random() * question.options.length)];
      } else {
        // choose 1-3 correct options randomly
        const shuffled = [...question.options].sort(() => 0.5 - Math.random());
        question.correctAnswer = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
      }
    } else if (type === 'numeric') {
      question.min = 0;
      question.max = 100;
      question.correctAnswer = Math.floor(Math.random() * 101);
    } else if (type === 'short-text') {
      question.maxLength = 100;
      question.correctAnswer = 'sample';
    } else if (type === 'long-text') {
      question.maxLength = 1000;
      question.correctAnswer = 'sample reference';
    }

    questions.push(question);
  }

  return questions;
};

// Generate sample applications
const generateApplications = (jobs) => {
  const applications = [];
  const candidateNames = [
    'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'David Brown',
    'Lisa Anderson', 'Chris Taylor', 'Jessica Martinez', 'Ryan Garcia', 'Amanda White',
    'Kevin Lee', 'Rachel Thompson', 'Daniel Rodriguez', 'Jennifer Clark', 'Michael Lewis',
    'Alex Chen', 'Maria Rodriguez', 'James Wilson', 'Ashley Brown', 'Robert Taylor',
    'Michelle Garcia', 'Christopher Lee', 'Amanda Johnson', 'Matthew Davis', 'Stephanie Wilson',
    'Andrew Martinez', 'Nicole Anderson', 'Joshua Thompson', 'Samantha White', 'Brandon Clark',
    'Megan Lewis', 'Tyler Garcia', 'Kayla Rodriguez', 'Justin Wilson', 'Brittany Brown',
    'Zachary Taylor', 'Courtney Johnson', 'Nathan Davis', 'Heather Martinez', 'Cody Anderson',
    'Danielle Thompson', 'Austin White', 'Chelsea Clark', 'Jordan Lewis', 'Paige Garcia',
    'Connor Rodriguez', 'Brooke Wilson', 'Ethan Brown', 'Hannah Taylor', 'Noah Johnson',
    'Madison Davis', 'Liam Martinez', 'Ava Anderson', 'William Thompson', 'Sophia White',
    'James Clark', 'Isabella Lewis', 'Benjamin Garcia', 'Mia Rodriguez', 'Lucas Wilson',
    'Charlotte Brown', 'Henry Taylor', 'Amelia Johnson', 'Alexander Davis', 'Harper Martinez',
    'Mason Anderson', 'Evelyn Thompson', 'Michael White', 'Abigail Clark', 'Daniel Lewis',
    'Emily Garcia', 'Matthew Rodriguez', 'Elizabeth Wilson', 'Jackson Brown', 'Sofia Taylor',
    'Sebastian Johnson', 'Avery Davis', 'Jack Martinez', 'Ella Anderson', 'Owen Thompson',
    'Scarlett White', 'Theodore Clark', 'Grace Lewis', 'Aiden Garcia', 'Chloe Rodriguez',
    'Samuel Wilson', 'Camila Brown', 'Joseph Taylor', 'Penelope Johnson', 'John Davis',
    'Layla Martinez', 'David Anderson', 'Riley Thompson', 'Wyatt White', 'Nora Clark',
    'Christian Lewis', 'Zoey Garcia', 'Hunter Rodriguez', 'Mila Wilson', 'Andrew Brown',
    'Aubrey Taylor', 'Carter Johnson', 'Hazel Davis', 'Jayden Martinez', 'Violet Anderson',
    'Luke Thompson', 'Aurora White', 'Grayson Clark', 'Nova Lewis', 'Isaac Garcia',
    'Luna Rodriguez', 'Oliver Wilson', 'Stella Brown', 'Caleb Taylor', 'Bella Johnson',
    'Ryan Davis', 'Leah Martinez', 'Nathan Anderson', 'Savannah Thompson', 'Adrian White',
    'Claire Clark', 'Miles Lewis', 'Skylar Garcia', 'Sawyer Rodriguez', 'Ellie Wilson',
    'Blake Brown', 'Paisley Taylor', 'Bentley Johnson', 'Everly Davis', 'Parker Martinez',
    'Peyton Anderson', 'Kennedy Thompson', 'Weston White', 'Brielle Clark', 'Emmett Lewis',
    'Delilah Garcia', 'Silas Rodriguez', 'Serenity Wilson', 'Ezekiel Brown', 'Willow Taylor',
    'Colton Johnson', 'Natalie Davis', 'Elias Martinez', 'Kinsley Anderson', 'Felix Thompson',
    'Allison White', 'Brayden Clark', 'Maya Lewis', 'Maximus Garcia', 'Madelyn Rodriguez',
    'Declan Wilson', 'Piper Brown', 'Damian Taylor', 'Ruby Johnson', 'Ryder Davis',
    'Sophie Martinez', 'Kingston Anderson', 'Elena Thompson', 'Tristan White', 'Paisley Clark',
    'Knox Lewis', 'Iris Garcia', 'Kai Rodriguez', 'Eliana Wilson', 'Phoenix Brown',
    'Remi Taylor', 'Rowan Johnson', 'Sage Davis', 'Atlas Martinez', 'Nova Anderson',
    'River Thompson', 'Ember White', 'Forest Clark', 'Wren Lewis', 'Ocean Garcia',
    'Sky Rodriguez', 'Storm Wilson', 'Blaze Brown', 'Echo Taylor', 'Phoenix Johnson',
    'Raven Davis', 'Fox Martinez', 'Wolf Anderson', 'Bear Thompson', 'Lion White',
    'Tiger Clark', 'Eagle Lewis', 'Hawk Garcia', 'Falcon Rodriguez', 'Owl Wilson',
    'Swan Brown', 'Dove Taylor', 'Robin Johnson', 'Cardinal Davis', 'Bluebird Martinez',
    'Canary Anderson', 'Finch Thompson', 'Wren White', 'Sparrow Clark', 'Hummingbird Lewis',
    'Woodpecker Garcia', 'Kingfisher Rodriguez', 'Heron Wilson', 'Egret Brown', 'Crane Taylor',
    'Stork Johnson', 'Pelican Davis', 'Cormorant Martinez', 'Gannet Anderson', 'Booby Thompson',
    'Frigatebird White', 'Tropicbird Clark', 'Albatross Lewis', 'Petrel Garcia', 'Shearwater Rodriguez',
    'Storm-petrel Wilson', 'Diving-petrel Brown', 'Prion Taylor', 'Fulmar Johnson', 'Murre Davis',
    'Guillemot Martinez', 'Razorbill Anderson', 'Puffin Thompson', 'Auklet White', 'Murrelet Clark',
    'Dovekie Lewis', 'Gull Garcia', 'Tern Rodriguez', 'Skua Wilson', 'Jaeger Brown',
    'Kittiwake Taylor', 'Noddy Johnson', 'Sooty Tern Davis', 'Bridled Tern Martinez', 'Least Tern Anderson',
    'Gull-billed Tern Thompson', 'Caspian Tern White', 'Royal Tern Clark', 'Sandwich Tern Lewis', 'Elegant Tern Garcia',
    'Forster\'s Tern Rodriguez', 'Common Tern Wilson', 'Arctic Tern Brown', 'Roseate Tern Taylor', 'Black Tern Johnson',
    'White-winged Tern Davis', 'Whiskered Tern Martinez', 'Black-naped Tern Anderson', 'Sooty Tern Thompson', 'Bridled Tern White',
    'Little Tern Clark', 'Least Tern Lewis', 'Gull-billed Tern Garcia', 'Caspian Tern Rodriguez', 'Royal Tern Wilson',
    'Sandwich Tern Brown', 'Elegant Tern Taylor', 'Forster\'s Tern Johnson', 'Common Tern Davis', 'Arctic Tern Martinez',
    'Roseate Tern Anderson', 'Black Tern Thompson', 'White-winged Tern White', 'Whiskered Tern Clark', 'Black-naped Tern Lewis'
  ];
  
  const candidateEmails = candidateNames.map(name => {
    const [firstName, lastName] = name.toLowerCase().split(' ');
    return `${firstName}.${lastName}@email.com`;
  });

  // Create 5-15 applications per job
  jobs.forEach((job, jobIndex) => {
    const numApplications = Math.floor(Math.random() * 11) + 5; // 5-15 applications
    
    for (let i = 0; i < numApplications; i++) {
      const candidateIndex = (jobIndex * 4 + i) % candidateNames.length;
      const appliedAt = new Date();
      appliedAt.setDate(appliedAt.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
      
      applications.push({
        id: `application-${jobIndex}-${i}`,
        jobId: job.id,
        candidateId: `candidate-${candidateIndex + 1}`,
        candidateName: candidateNames[candidateIndex],
        candidateEmail: candidateEmails[candidateIndex],
        status: ['applied', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected'][Math.floor(Math.random() * 6)],
        appliedAt: appliedAt,
        updatedAt: appliedAt
      });
    }
  });

  return applications;
};

// Generate sample assignments
const generateAssignments = (applications, assessments) => {
  const assignments = [];
  
  applications.forEach((application, index) => {
    // Find assessment for this job
    const assessment = assessments.find(a => a.jobId === application.jobId);
    
    if (assessment) {
      const validUntil = new Date(application.appliedAt);
      validUntil.setDate(validUntil.getDate() + 5); // 5 days validity
      
      const isExpired = validUntil < new Date();
      const isSubmitted = Math.random() > 0.6; // 40% chance of being submitted
      
      assignments.push({
        id: `assignment-${index}`,
        jobId: application.jobId,
        candidateId: application.candidateId,
        assessmentId: assessment.id,
        status: isSubmitted ? 'submitted' : (isExpired ? 'expired' : 'pending'),
        validUntil: validUntil,
        createdAt: application.appliedAt,
        submittedAt: isSubmitted ? new Date(validUntil.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null
      });
    }
  });

  return assignments;
};

// Export database instance for use in other modules
export { db };
