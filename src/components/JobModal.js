import React, { useState, useEffect } from 'react';
import { createJob, updateJob } from '../services/jobsApi';
import './JobModal.css';

const JobModal = ({ job, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    requirements: [],
    responsibilities: [],
    location: '',
    salary: '',
    status: 'active',
    experienceLevel: 'Experience',
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');

  const isEditing = !!job;

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        slug: job.slug || '',
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        location: job.location || '',
        salary: job.salary || '',
        status: job.status || 'active',
        experienceLevel: job.experienceLevel || 'Experience',
        tags: job.tags || []
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        requirements: [],
        responsibilities: [],
        location: '',
        salary: '',
        status: 'active',
        experienceLevel: 'Experience',
        tags: []
      });
    }
  }, [job]);

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug when title changes
    if (name === 'title' && !isEditing) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim() && !formData.requirements.includes(requirementInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (requirementToRemove) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }));
  };

  const handleAddResponsibility = () => {
    if (responsibilityInput.trim() && !formData.responsibilities.includes(responsibilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, responsibilityInput.trim()]
      }));
      setResponsibilityInput('');
    }
  };

  const handleRemoveResponsibility = (responsibilityToRemove) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter(resp => resp !== responsibilityToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.salary.trim()) {
      newErrors.salary = 'Salary is required';
    }

    if (formData.requirements.length === 0) {
      newErrors.requirements = 'At least one requirement is required';
    }

    if (formData.responsibilities.length === 0) {
      newErrors.responsibilities = 'At least one responsibility is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateJob(job.id, formData);
      } else {
        await createJob(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error submitting job:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Job' : 'Create New Job'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-control ${errors.title ? 'error' : ''}`}
              placeholder="Enter job title"
              disabled={loading}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="slug" className="form-label">
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className={`form-control ${errors.slug ? 'error' : ''}`}
              placeholder="job-url-slug"
              disabled={loading}
            />
            {errors.slug && <span className="error-text">{errors.slug}</span>}
            <small className="form-help">
              This will be used in the job URL. Only lowercase letters, numbers, and hyphens allowed.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`form-control ${errors.description ? 'error' : ''}`}
              placeholder="Describe the role, company culture, and what makes this opportunity unique..."
              rows="4"
              disabled={loading}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`form-control ${errors.location ? 'error' : ''}`}
              placeholder="e.g., San Francisco, CA or Remote"
              disabled={loading}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="salary" className="form-label">
              Salary *
            </label>
            <input
              type="text"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className={`form-control ${errors.salary ? 'error' : ''}`}
              placeholder="e.g., $80,000 - $120,000"
              disabled={loading}
            />
            {errors.salary && <span className="error-text">{errors.salary}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Requirements *
            </label>
            <div className="list-input">
              <div className="list-items">
                {formData.requirements.map((requirement, index) => (
                  <span key={index} className="list-item">
                    {requirement}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(requirement)}
                      className="remove-btn"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="list-input-controls">
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequirement();
                    }
                  }}
                  className={`form-control ${errors.requirements ? 'error' : ''}`}
                  placeholder="Add a requirement (e.g., 3+ years React experience)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="add-btn"
                  disabled={loading || !requirementInput.trim()}
                >
                  Add
                </button>
              </div>
              {errors.requirements && <span className="error-text">{errors.requirements}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Responsibilities *
            </label>
            <div className="list-input">
              <div className="list-items">
                {formData.responsibilities.map((responsibility, index) => (
                  <span key={index} className="list-item">
                    {responsibility}
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(responsibility)}
                      className="remove-btn"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="list-input-controls">
                <input
                  type="text"
                  value={responsibilityInput}
                  onChange={(e) => setResponsibilityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResponsibility();
                    }
                  }}
                  className={`form-control ${errors.responsibilities ? 'error' : ''}`}
                  placeholder="Add a responsibility (e.g., Develop and maintain web applications)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddResponsibility}
                  className="add-btn"
                  disabled={loading || !responsibilityInput.trim()}
                >
                  Add
                </button>
              </div>
              {errors.responsibilities && <span className="error-text">{errors.responsibilities}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="form-control"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Experience Level
            </label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="experienceLevel"
                  value="Fresher"
                  checked={formData.experienceLevel === 'Fresher'}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="radio-label">
                  <span className="radio-indicator fresher"></span>
                  Fresher
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="experienceLevel"
                  value="Experience"
                  checked={formData.experienceLevel === 'Experience'}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="radio-label">
                  <span className="radio-indicator experience"></span>
                  Experience
                </span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags-input">
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-control"
                placeholder="Add a tag..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-secondary"
                disabled={loading || !tagInput.trim()}
              >
                Add
              </button>
            </div>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobModal;
