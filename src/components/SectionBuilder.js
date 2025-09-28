import React, { useState, useEffect } from 'react';
import './SectionBuilder.css';

const SectionBuilder = ({ section, onUpdate }) => {
  // All hooks must be called unconditionally at the top
  const [formData, setFormData] = useState(() => {
    // Use conditional initializer for safe defaults
    if (!section || typeof section !== 'object') {
      return {
        sectionId: '',
        title: '',
        description: ''
      };
    }
    return {
      sectionId: section.id || '',
      title: section.title || '',
      description: section.description || ''
    };
  });

  useEffect(() => {
    // Guard inside the effect instead of conditional hook
    if (!section || typeof section !== 'object') {
      return;
    }

    // Only reset form data if the section ID changes (new section selected)
    // This prevents resetting on every keystroke
    setFormData(prevFormData => {
      // If it's a different section, reset the form
      if (prevFormData.sectionId !== section.id) {
        return {
          sectionId: section.id,
          title: section.title || '',
          description: section.description || ''
        };
      }
      // Otherwise, keep the current form data
      return prevFormData;
    });
  }, [section?.id]); // Only depend on section.id, not the entire section object
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Early return AFTER all hooks are declared
  if (!section || typeof section !== 'object') {
    return (
      <div className="section-builder">
        <div className="builder-header">
          <h3>Section Builder</h3>
        </div>
        <div className="builder-content">
          <p>No section selected</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  return (
    <div className="section-builder">
      <div className="builder-panel">
        <h3>Section Settings</h3>
        
        <div className="form-group">
          <label htmlFor="section-title" className="form-label">
            Section Title *
          </label>
          <input
            type="text"
            id="section-title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-control"
            placeholder="Enter section title..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="section-description" className="form-label">
            Section Description
          </label>
          <textarea
            id="section-description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-control"
            rows={3}
            placeholder="Enter section description (optional)..."
          />
        </div>

        <div className="section-stats">
          <div className="stat-item">
            <span className="stat-label">Questions:</span>
            <span className="stat-value">{section.questions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Order:</span>
            <span className="stat-value">{section.order}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionBuilder;


