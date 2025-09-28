import React, { useState } from 'react';
import './AssessmentPreview.css';

const AssessmentPreview = ({ assessment }) => {
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

  // Guard clause to handle null/undefined assessment
  if (!assessment || typeof assessment !== 'object') {
    return (
      <div className="assessment-preview">
        <div className="preview-header">
          <h2>Assessment Preview</h2>
          <p>No assessment data available</p>
        </div>
        <div className="preview-content">
          <p>Please create an assessment first to see the preview.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateQuestion = (question) => {
    const value = responses[question.id];
    
    if (question.required && (!value || value === '')) {
      return 'This field is required';
    }
    
    if (question.type === 'numeric' && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return 'Please enter a valid number';
      }
      if (question.min !== undefined && numValue < question.min) {
        return `Value must be at least ${question.min}`;
      }
      if (question.max !== undefined && numValue > question.max) {
        return `Value must be at most ${question.max}`;
      }
    }
    
    if (question.type === 'short-text' && value && value.length > question.maxLength) {
      return `Text must be no more than ${question.maxLength} characters`;
    }
    
    if (question.type === 'long-text' && value && value.length > question.maxLength) {
      return `Text must be no more than ${question.maxLength} characters`;
    }
    
    return null;
  };

  const shouldShowQuestion = (question) => {
    if (!question.conditionalLogic) return true;
    
    const { condition, value, operator } = question.conditionalLogic;
    const conditionResponse = responses[condition];
    
    if (!conditionResponse) return false;
    
    switch (operator) {
      case 'equals':
        return conditionResponse === value;
      case 'not_equals':
        return conditionResponse !== value;
      case 'contains':
        return conditionResponse.includes(value);
      default:
        return true;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let hasErrors = false;
    
    if (assessment.sections && Array.isArray(assessment.sections)) {
      assessment.sections.forEach(section => {
        if (section && section.questions && Array.isArray(section.questions)) {
          section.questions.forEach(question => {
            if (shouldShowQuestion(question)) {
              const error = validateQuestion(question);
              if (error) {
                newErrors[question.id] = error;
                hasErrors = true;
              }
            }
          });
        }
      });
    }
    
    setErrors(newErrors);
    
    if (!hasErrors) {
      alert('Assessment submitted successfully! (This is a preview)');
      console.log('Assessment responses:', responses);
    }
  };

  const renderQuestion = (question) => {
    if (!shouldShowQuestion(question)) return null;
    
    const value = responses[question.id] || '';
    const error = errors[question.id];
    
    return (
      <div key={question.id} className="preview-question">
        <label className="question-label">
          {question.title}
          {question.required && <span className="required">*</span>}
        </label>
        
        {question.type === 'single-choice' && (
          <div className="radio-group">
            {question.options.map((option, index) => (
              <label key={index} className="radio-option">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'multi-choice' && (
          <div className="checkbox-group">
            {question.options.map((option, index) => (
              <label key={index} className="checkbox-option">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleInputChange(question.id, newValues);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'short-text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            maxLength={question.maxLength}
            className={`form-control ${error ? 'error' : ''}`}
            placeholder="Enter your answer..."
          />
        )}
        
        {question.type === 'long-text' && (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            maxLength={question.maxLength}
            rows={4}
            className={`form-control ${error ? 'error' : ''}`}
            placeholder="Enter your answer..."
          />
        )}
        
        {question.type === 'numeric' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            min={question.min}
            max={question.max}
            className={`form-control ${error ? 'error' : ''}`}
            placeholder={`Enter a number between ${question.min} and ${question.max}`}
          />
        )}
        
        {question.type === 'file-upload' && (
          <div className="file-upload">
            <input
              type="file"
              onChange={(e) => handleInputChange(question.id, e.target.files[0]?.name || '')}
              className="form-control"
            />
            <small>Upload a file (preview only)</small>
          </div>
        )}
        
        {error && <span className="error-text">{error}</span>}
        
        {question.type === 'short-text' && question.maxLength && (
          <small className="char-count">
            {value.length}/{question.maxLength} characters
          </small>
        )}
        
        {question.type === 'long-text' && question.maxLength && (
          <small className="char-count">
            {value.length}/{question.maxLength} characters
          </small>
        )}
      </div>
    );
  };

  return (
    <div className="assessment-preview">
      <div className="preview-header">
        <h2>{assessment.title || 'Untitled Assessment'}</h2>
        <p>This is a live preview of how candidates will see the assessment.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="preview-form">
        {assessment.sections && Array.isArray(assessment.sections) ? assessment.sections.map((section, sectionIndex) => (
          <div key={section.id} className="preview-section">
            <h3 className="section-title">
              {sectionIndex + 1}. {section.title}
            </h3>
            {section.description && (
              <p className="section-description">{section.description}</p>
            )}
            
            <div className="questions-container">
              {section.questions && Array.isArray(section.questions) ? section.questions.map(renderQuestion) : (
                <p>No questions in this section</p>
              )}
            </div>
          </div>
        )) : (
          <div className="no-sections">
            <p>No sections available in this assessment.</p>
          </div>
        )}

        <div className="preview-actions">
          <button type="submit" className="btn btn-primary">
            Submit Assessment
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentPreview;



