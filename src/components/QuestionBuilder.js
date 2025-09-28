import React, { useState, useEffect } from 'react';
import './QuestionBuilder.css';

const QuestionBuilder = ({ question, section, assessment, onUpdate }) => {
  // All hooks must be called unconditionally at the top
  const [formData, setFormData] = useState(() => {
    // Use conditional initializer for safe defaults
    if (!question || typeof question !== 'object') {
      return {
        questionId: '',
        title: '',
        required: false,
        options: [],
        min: 0,
        max: 100,
        maxLength: 100,
        marks: 1,
        correctAnswer: null,
        conditionalLogic: null
      };
    }
    return {
      questionId: question.id || '',
      title: question.title || '',
      required: question.required || false,
      options: question.options || [],
      min: question.min || 0,
      max: question.max || 100,
      maxLength: question.maxLength || 100,
      marks: typeof question.marks === 'number' ? question.marks : 1,
      correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : null,
      conditionalLogic: question.conditionalLogic || null
    };
  });

  const [newOption, setNewOption] = useState('');
  const [showConditionalLogic, setShowConditionalLogic] = useState(() => {
    return !!(question && question.conditionalLogic);
  });

  useEffect(() => {
    // Guard inside the effect instead of conditional hook
    if (!question || typeof question !== 'object') {
      return;
    }

    // Only reset form data if the question ID changes (new question selected)
    // This prevents resetting on every keystroke
    setFormData(prevFormData => {
      // If it's a different question, reset the form
      if (prevFormData.questionId !== question.id) {
        return {
          questionId: question.id,
          title: question.title || '',
          required: question.required || false,
          options: question.options || [],
          min: question.min || 0,
          max: question.max || 100,
          maxLength: question.maxLength || 100,
          marks: typeof question.marks === 'number' ? question.marks : 1,
          correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : null,
          conditionalLogic: question.conditionalLogic || null
        };
      }
      // Otherwise, keep the current form data
      return prevFormData;
    });
    setShowConditionalLogic(!!question.conditionalLogic);
  }, [question?.id]); // Only depend on question.id, not the entire question object
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Early return AFTER all hooks are declared
  if (!question || typeof question !== 'object') {
    return (
      <div className="question-builder">
        <div className="builder-header">
          <h3>Question Builder</h3>
        </div>
        <div className="builder-content">
          <p>No question selected</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: parseInt(value) || 0 };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      const newOptions = [...formData.options, newOption.trim()];
      const newFormData = { ...formData, options: newOptions };
      setFormData(newFormData);
      onUpdate(newFormData);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    const newFormData = { ...formData, options: newOptions };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    const newFormData = { ...formData, options: newOptions };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const handleConditionalLogicChange = (field, value) => {
    const newConditionalLogic = {
      ...formData.conditionalLogic,
      [field]: value
    };
    const newFormData = { ...formData, conditionalLogic: newConditionalLogic };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const toggleConditionalLogic = () => {
    if (showConditionalLogic) {
      const newFormData = { ...formData, conditionalLogic: null };
      setFormData(newFormData);
      onUpdate(newFormData);
    }
    setShowConditionalLogic(!showConditionalLogic);
  };

  // Get all questions from previous sections for conditional logic
  const getPreviousQuestions = () => {
    const questions = [];
    assessment.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.id !== formData.id) {
          questions.push({
            id: question.id,
            title: question.title,
            type: question.type
          });
        }
      });
    });
    return questions;
  };

  const previousQuestions = getPreviousQuestions();

  return (
    <div className="question-builder">
      <div className="builder-panel">
        <h3>Question Settings</h3>
        
        <div className="form-group">
          <label htmlFor="question-title" className="form-label">
            Question Title *
          </label>
          <input
            type="text"
            id="question-title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-control"
            placeholder="Enter question title..."
            required
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="required"
              checked={formData.required}
              onChange={handleInputChange}
            />
            <span>Required question</span>
          </label>
        </div>

        {/* Options for choice questions */}
        {(question.type === 'single-choice' || question.type === 'multi-choice') && (
          <div className="form-group">
            <label className="form-label">Options</label>
            <div className="options-list">
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="form-control"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn-remove"
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="add-option">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="form-control"
                placeholder="Add new option..."
                onKeyPress={(e) => e.key === 'Enter' && addOption()}
              />
              <button
                type="button"
                onClick={addOption}
                className="btn btn-secondary btn-sm"
                disabled={!newOption.trim()}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Numeric range for numeric questions */}
        {question.type === 'numeric' && (
          <div className="form-group">
            <label className="form-label">Numeric Range</label>
            <div className="range-inputs">
              <div className="range-input">
                <label htmlFor="min-value">Minimum</label>
                <input
                  type="number"
                  id="min-value"
                  name="min"
                  value={formData.min}
                  onChange={handleNumberChange}
                  className="form-control"
                />
              </div>
              <div className="range-input">
                <label htmlFor="max-value">Maximum</label>
                <input
                  type="number"
                  id="max-value"
                  name="max"
                  value={formData.max}
                  onChange={handleNumberChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        )}

        {/* Max length for text questions */}
        {(question.type === 'short-text' || question.type === 'long-text') && (
          <div className="form-group">
            <label htmlFor="max-length" className="form-label">
              Maximum Length
            </label>
            <input
              type="number"
              id="max-length"
              name="maxLength"
              value={formData.maxLength}
              onChange={handleNumberChange}
              className="form-control"
              min="1"
            />
          </div>
        )}

        {/* Scoring: Marks and Correct Answer */}
        <div className="form-group">
          <label htmlFor="marks" className="form-label">Marks</label>
          <input
            type="number"
            id="marks"
            name="marks"
            value={formData.marks}
            onChange={handleNumberChange}
            className="form-control"
            min="0"
          />
        </div>

        {/* Correct answer configuration depends on type */}
        {(question.type === 'single-choice') && (
          <div className="form-group">
            <label className="form-label">Correct Answer (Single Choice)</label>
            <select
              className="form-control"
              value={formData.correctAnswer || ''}
              onChange={(e) => {
                const newFormData = { ...formData, correctAnswer: e.target.value };
                setFormData(newFormData);
                onUpdate(newFormData);
              }}
            >
              <option value="">None</option>
              {formData.options.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {(question.type === 'multi-choice') && (
          <div className="form-group">
            <label className="form-label">Correct Answers (Multiple)</label>
            <div className="options-list">
              {formData.options.map((opt, idx) => {
                const selected = Array.isArray(formData.correctAnswer) ? formData.correctAnswer : [];
                const isChecked = selected.includes(opt);
                return (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = Array.isArray(formData.correctAnswer) ? [...formData.correctAnswer] : [];
                        const next = e.target.checked ? [...current, opt] : current.filter(v => v !== opt);
                        const newFormData = { ...formData, correctAnswer: next };
                        setFormData(newFormData);
                        onUpdate(newFormData);
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {(question.type === 'short-text' || question.type === 'long-text') && (
          <div className="form-group">
            <label className="form-label">Expected Answer (optional)</label>
            <input
              type="text"
              value={formData.correctAnswer || ''}
              onChange={(e) => {
                const newFormData = { ...formData, correctAnswer: e.target.value };
                setFormData(newFormData);
                onUpdate(newFormData);
              }}
              className="form-control"
              placeholder="Provide a reference answer to aid manual review"
            />
          </div>
        )}

        {question.type === 'numeric' && (
          <div className="form-group">
            <label className="form-label">Correct Number (optional)</label>
            <input
              type="number"
              value={formData.correctAnswer ?? ''}
              onChange={(e) => {
                const newFormData = { ...formData, correctAnswer: e.target.value === '' ? null : parseFloat(e.target.value) };
                setFormData(newFormData);
                onUpdate(newFormData);
              }}
              className="form-control"
            />
          </div>
        )}

        {/* Conditional Logic */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showConditionalLogic}
              onChange={toggleConditionalLogic}
            />
            <span>Add conditional logic</span>
          </label>
          
          {showConditionalLogic && (
            <div className="conditional-logic">
              <div className="logic-row">
                <label>Show this question if</label>
                <select
                  value={formData.conditionalLogic?.condition || ''}
                  onChange={(e) => handleConditionalLogicChange('condition', e.target.value)}
                  className="form-control"
                >
                  <option value="">Select question...</option>
                  {previousQuestions.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="logic-row">
                <select
                  value={formData.conditionalLogic?.operator || 'equals'}
                  onChange={(e) => handleConditionalLogicChange('operator', e.target.value)}
                  className="form-control"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">does not equal</option>
                  <option value="contains">contains</option>
                </select>
              </div>
              
              <div className="logic-row">
                <input
                  type="text"
                  value={formData.conditionalLogic?.value || ''}
                  onChange={(e) => handleConditionalLogicChange('value', e.target.value)}
                  className="form-control"
                  placeholder="Enter value..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="question-stats">
          <div className="stat-item">
            <span className="stat-label">Type:</span>
            <span className="stat-value">{question.type}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Order:</span>
            <span className="stat-value">{question.order}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;


