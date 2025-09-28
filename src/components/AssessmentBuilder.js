import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessments, updateAssessment } from '../services/assessmentsApi';
import AssessmentPreview from './AssessmentPreview';
import QuestionBuilder from './QuestionBuilder';
import SectionBuilder from './SectionBuilder';
import './AssessmentBuilder.css';

const AssessmentBuilder = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  console.log('AssessmentBuilder: Component mounted with jobId:', jobId);
  console.log('AssessmentBuilder: jobId type:', typeof jobId);
  console.log('AssessmentBuilder: jobId value:', jobId);

  // Fetch assessment data
  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AssessmentBuilder: Fetching assessment for jobId:', jobId);
      console.log('AssessmentBuilder: jobId type in fetchAssessment:', typeof jobId);
      
      // Test if MSW is working
      try {
        const testResponse = await fetch('/api/test');
        const testData = await testResponse.json();
        console.log('AssessmentBuilder: MSW test result:', testData);
      } catch (testError) {
        console.warn('AssessmentBuilder: MSW test failed:', testError);
      }
      
      // Convert numeric jobId to proper format if needed
      const properJobId = jobId && !jobId.startsWith('job-') ? `job-${jobId}` : jobId;
      console.log('AssessmentBuilder: Using properJobId:', properJobId);
      
      const response = await getAssessments(properJobId);
      console.log('AssessmentBuilder: Assessment response:', response);
      
      if (response) {
        setAssessment(response);
        
        // Set first section as active if none selected
        if (response.sections && response.sections.length > 0 && !activeSection) {
          setActiveSection(response.sections[0].id);
        }
      } else {
        // No assessment exists, create a default one
        console.log('AssessmentBuilder: No assessment found, creating default');
        const defaultAssessment = {
          id: `assessment-${Date.now()}`,
          jobId: properJobId,
          title: 'Job Assessment',
          sections: [
            {
              id: `section-1`,
              title: 'General Questions',
              questions: []
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setAssessment(defaultAssessment);
        setActiveSection('section-1');
      }
    } catch (err) {
      console.error('AssessmentBuilder: Error fetching assessment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, activeSection]);

  useEffect(() => {
    if (jobId) {
      fetchAssessment();
    }
  }, [fetchAssessment, jobId]);

  // Handle back navigation
  const handleBack = () => {
    navigate(`/jobs/${jobId}`);
  };

  // Save assessment changes
  const saveAssessment = async (updatedAssessment) => {
    try {
      // Convert numeric jobId to proper format if needed
      const properJobId = jobId && !jobId.startsWith('job-') ? `job-${jobId}` : jobId;
      console.log('AssessmentBuilder: Saving assessment for properJobId:', properJobId);
      
      await updateAssessment(properJobId, updatedAssessment);
      setAssessment(updatedAssessment);
    } catch (err) {
      console.error('AssessmentBuilder: Error saving assessment:', err);
      setError(err.message);
    }
  };

  // Add new section
  const addSection = () => {
    if (!assessment) return;

    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      questions: [],
      order: assessment.sections.length + 1
    };

    const updatedAssessment = {
      ...assessment,
      sections: [...assessment.sections, newSection]
    };

    saveAssessment(updatedAssessment);
    setActiveSection(newSection.id);
  };

  // Update section
  const updateSection = (sectionId, updates) => {
    if (!assessment) return;

    const updatedAssessment = {
      ...assessment,
      sections: assessment.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    };

    saveAssessment(updatedAssessment);
  };

  // Delete section
  const deleteSection = (sectionId) => {
    if (!assessment) return;

    const updatedAssessment = {
      ...assessment,
      sections: assessment.sections.filter(section => section.id !== sectionId)
    };

    saveAssessment(updatedAssessment);
    
    // Set new active section if current one was deleted
    if (activeSection === sectionId) {
      const remainingSections = updatedAssessment.sections;
      setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null);
    }
  };

  // Add question to section
  const addQuestion = (sectionId, questionType) => {
    if (!assessment) return;

    const section = assessment.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newQuestion = {
      id: `question-${Date.now()}`,
      type: questionType,
      title: `New ${questionType.replace('-', ' ')} Question`,
      required: false,
      order: section.questions.length + 1,
      options: questionType.includes('choice') ? ['Option 1', 'Option 2'] : [],
      min: questionType === 'numeric' ? 0 : undefined,
      max: questionType === 'numeric' ? 100 : undefined,
      maxLength: questionType.includes('text') ? (questionType === 'short-text' ? 100 : 1000) : undefined,
      conditionalLogic: null
    };

    const updatedAssessment = {
      ...assessment,
      sections: assessment.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    };

    saveAssessment(updatedAssessment);
    setActiveQuestion(newQuestion.id);
  };

  // Update question
  const updateQuestion = (sectionId, questionId, updates) => {
    if (!assessment) return;

    const updatedAssessment = {
      ...assessment,
      sections: assessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates } : question
              )
            }
          : section
      )
    };

    saveAssessment(updatedAssessment);
  };

  // Delete question
  const deleteQuestion = (sectionId, questionId) => {
    if (!assessment) return;

    const updatedAssessment = {
      ...assessment,
      sections: assessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(question => question.id !== questionId)
            }
          : section
      )
    };

    saveAssessment(updatedAssessment);
    
    if (activeQuestion === questionId) {
      setActiveQuestion(null);
    }
  };

  if (loading) {
    return (
      <div className="assessment-builder">
        <div className="loading">
          <h2>Loading Assessment...</h2>
          <p>Please wait while we load the assessment for job: {jobId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-builder">
        <div className="error-message">
          <h2>Error Loading Assessment</h2>
          <p>Job ID: {jobId}</p>
          <p>Error: {error}</p>
          <button onClick={handleBack} className="btn btn-secondary">
            ← Back to Job
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="assessment-builder">
        <div className="not-found">
          <h2>Assessment Not Found</h2>
          <p>Job ID: {jobId}</p>
          <p>No assessment found for this job. This might be a new job without an assessment yet.</p>
          <button onClick={handleBack} className="btn btn-secondary">
            ← Back to Job
          </button>
        </div>
      </div>
    );
  }

  const currentSection = assessment.sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions.find(q => q.id === activeQuestion);

  return (
    <div className="assessment-builder">
      <div className="builder-header">
        <div className="header-left">
          <button onClick={handleBack} className="btn btn-secondary back-btn">
            ← Back to Job
          </button>
          <h2>Assessment Builder</h2>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn ${previewMode ? 'btn-secondary' : 'btn-primary'}`}
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <AssessmentPreview assessment={assessment} />
      ) : (
        <div className="builder-content">
          <div className="builder-sidebar">
            <div className="sections-panel">
              <div className="panel-header">
                <h3>Sections</h3>
                <button onClick={addSection} className="btn btn-primary btn-sm">
                  + Add Section
                </button>
              </div>
              
              <div className="sections-list">
                {assessment.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`section-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className="section-info">
                      <span className="section-number">{index + 1}</span>
                      <span className="section-title">{section.title}</span>
                      <span className="question-count">
                        {section.questions.length} questions
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="btn-delete"
                      title="Delete Section"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {currentSection && (
              <div className="questions-panel">
                <div className="panel-header">
                  <h3>Questions</h3>
                  <div className="question-type-buttons">
                    <button
                      onClick={() => addQuestion(currentSection.id, 'single-choice')}
                      className="btn btn-sm btn-secondary"
                      title="Single Choice"
                    >
                      Radio
                    </button>
                    <button
                      onClick={() => addQuestion(currentSection.id, 'multi-choice')}
                      className="btn btn-sm btn-secondary"
                      title="Multiple Choice"
                    >
                      Checkbox
                    </button>
                    <button
                      onClick={() => addQuestion(currentSection.id, 'short-text')}
                      className="btn btn-sm btn-secondary"
                      title="Short Text"
                    >
                      Text
                    </button>
                    <button
                      onClick={() => addQuestion(currentSection.id, 'long-text')}
                      className="btn btn-sm btn-secondary"
                      title="Long Text"
                    >
                      Textarea
                    </button>
                    <button
                      onClick={() => addQuestion(currentSection.id, 'numeric')}
                      className="btn btn-sm btn-secondary"
                      title="Numeric"
                    >
                      Number
                    </button>
                    <button
                      onClick={() => addQuestion(currentSection.id, 'file-upload')}
                      className="btn btn-sm btn-secondary"
                      title="File Upload"
                    >
                      File
                    </button>
                  </div>
                </div>

                <div className="questions-list">
                  {currentSection.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`question-item ${activeQuestion === question.id ? 'active' : ''}`}
                      onClick={() => setActiveQuestion(question.id)}
                    >
                      <div className="question-info">
                        <span className="question-number">{index + 1}</span>
                        <span className="question-title">{question.title}</span>
                        <span className="question-type">{question.type}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(currentSection.id, question.id);
                        }}
                        className="btn-delete"
                        title="Delete Question"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="builder-main">
            {currentSection && (
              <SectionBuilder
                section={currentSection}
                onUpdate={(updates) => updateSection(currentSection.id, updates)}
              />
            )}

            {currentQuestion && (
              <QuestionBuilder
                question={currentQuestion}
                section={currentSection}
                assessment={assessment}
                onUpdate={(updates) => updateQuestion(currentSection.id, currentQuestion.id, updates)}
              />
            )}

            {!currentSection && (
              <div className="empty-state">
                <h3>Select a Section</h3>
                <p>Choose a section from the sidebar to start building your assessment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentBuilder;
