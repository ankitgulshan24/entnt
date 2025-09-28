// Fallback data in case MSW fails - Essential data for app functionality
export const fallbackJobs = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    slug: 'senior-react-developer',
    description: 'We are looking for an experienced React developer to join our team.',
    requirements: ['5+ years React experience', 'JavaScript ES6+', 'Redux/Context API'],
    responsibilities: ['Develop React applications', 'Code review', 'Mentor junior developers'],
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000',
    status: 'active',
    tags: ['React', 'JavaScript', 'Frontend'],
    order: 1,
    experienceLevel: 'Experience',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'job-2',
    title: 'Junior Frontend Developer',
    slug: 'junior-frontend-developer',
    description: 'Entry-level position for aspiring frontend developers.',
    requirements: ['1+ years JavaScript experience', 'HTML/CSS', 'React basics'],
    responsibilities: ['Build UI components', 'Fix bugs', 'Learn from senior developers'],
    location: 'Remote',
    salary: '$60,000 - $80,000',
    status: 'active',
    tags: ['React', 'JavaScript', 'CSS'],
    order: 2,
    experienceLevel: 'Fresher',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'job-3',
    title: 'Full Stack Engineer',
    slug: 'full-stack-engineer',
    description: 'Looking for a versatile developer who can work on both frontend and backend.',
    requirements: ['3+ years full-stack experience', 'Node.js', 'React', 'Database knowledge'],
    responsibilities: ['Develop full-stack applications', 'API design', 'Database optimization'],
    location: 'New York, NY',
    salary: '$100,000 - $130,000',
    status: 'active',
    tags: ['Node.js', 'React', 'Full-stack'],
    order: 3,
    experienceLevel: 'Experience',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: 'job-4',
    title: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    description: 'Creative designer to create beautiful and functional user interfaces.',
    requirements: ['2+ years design experience', 'Figma', 'User research', 'Prototyping'],
    responsibilities: ['Design user interfaces', 'Conduct user research', 'Create prototypes'],
    location: 'Los Angeles, CA',
    salary: '$70,000 - $90,000',
    status: 'active',
    tags: ['Design', 'Figma', 'UX'],
    order: 4,
    experienceLevel: 'Experience',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'job-5',
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    description: 'Infrastructure and deployment specialist to manage our cloud infrastructure.',
    requirements: ['3+ years DevOps experience', 'AWS/Azure', 'Docker', 'Kubernetes'],
    responsibilities: ['Manage cloud infrastructure', 'Automate deployments', 'Monitor systems'],
    location: 'Seattle, WA',
    salary: '$110,000 - $140,000',
    status: 'active',
    tags: ['DevOps', 'AWS', 'Docker'],
    order: 5,
    experienceLevel: 'Experience',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19')
  }
];

export const fallbackCandidates = [
  {
    id: 'candidate-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    experience: '5 years',
    skills: ['React', 'JavaScript', 'Node.js'],
    stage: 'applied',
    appliedAt: new Date('2024-01-20'),
    jobId: 'job-1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'candidate-2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0124',
    experience: '2 years',
    skills: ['React', 'CSS', 'HTML'],
    stage: 'interview',
    appliedAt: new Date('2024-01-21'),
    jobId: 'job-2',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: 'candidate-3',
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1-555-0125',
    experience: '4 years',
    skills: ['Node.js', 'React', 'MongoDB'],
    stage: 'screening',
    appliedAt: new Date('2024-01-22'),
    jobId: 'job-3',
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22')
  }
];

export const fallbackApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    candidateId: 'candidate-1',
    candidateName: 'John Smith',
    candidateEmail: 'john.smith@email.com',
    status: 'applied',
    appliedAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    candidateId: 'candidate-2',
    candidateName: 'Sarah Johnson',
    candidateEmail: 'sarah.johnson@email.com',
    status: 'interview',
    appliedAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: 'app-3',
    jobId: 'job-3',
    candidateId: 'candidate-3',
    candidateName: 'Mike Wilson',
    candidateEmail: 'mike.wilson@email.com',
    status: 'screening',
    appliedAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22')
  }
];

export const fallbackAssessments = [
  {
    id: 'assessment-1',
    jobId: 'job-1',
    title: 'Senior React Developer Assessment',
    sections: [
      {
        id: 'section-1',
        title: 'Technical Skills',
        questions: [
          {
            id: 'q1',
            title: 'What is React?',
            type: 'short-text',
            required: true,
            maxLength: 500
          },
          {
            id: 'q2',
            title: 'Explain the difference between state and props.',
            type: 'long-text',
            required: true,
            maxLength: 1000
          }
        ]
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];
