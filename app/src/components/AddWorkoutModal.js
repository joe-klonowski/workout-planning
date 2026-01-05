import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/AddWorkoutModal.css';

/**
 * Modal component for adding custom workouts
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSave - Callback to save the new workout
 * @param {Date} initialDate - Initial date to pre-fill (optional)
 */
function AddWorkoutModal({ isOpen, onClose, onSave, initialDate = null }) {
  const [formData, setFormData] = useState({
    title: '',
    workoutType: 'Swim',
    description: '',
    plannedDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
    plannedDuration: '',
    plannedDistanceInMeters: '',
    tss: '',
    timeOfDay: '',
    workoutLocation: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) {
    return null;
  }

  const workoutTypes = ['Swim', 'Bike', 'Run', 'Strength', 'Other'];
  const timeOfDayOptions = ['morning', 'afternoon', 'evening'];
  const locationOptions = ['indoor', 'outdoor'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.plannedDate) {
      newErrors.plannedDate = 'Date is required';
    }
    
    if (formData.plannedDuration && (isNaN(formData.plannedDuration) || parseFloat(formData.plannedDuration) <= 0)) {
      newErrors.plannedDuration = 'Duration must be a positive number';
    }
    
    if (formData.plannedDistanceInMeters && (isNaN(formData.plannedDistanceInMeters) || parseFloat(formData.plannedDistanceInMeters) <= 0)) {
      newErrors.plannedDistanceInMeters = 'Distance must be a positive number';
    }
    
    if (formData.tss && (isNaN(formData.tss) || parseFloat(formData.tss) <= 0)) {
      newErrors.tss = 'TSS must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    // Prepare data for API
    const workoutData = {
      title: formData.title.trim(),
      workoutType: formData.workoutType,
      description: formData.description.trim(),
      plannedDate: formData.plannedDate,
      plannedDuration: formData.plannedDuration ? parseFloat(formData.plannedDuration) : null,
      plannedDistanceInMeters: formData.plannedDistanceInMeters ? parseFloat(formData.plannedDistanceInMeters) : null,
      tss: formData.tss ? parseFloat(formData.tss) : null,
      timeOfDay: formData.timeOfDay || null,
      workoutLocation: formData.workoutLocation || null
    };
    
    onSave(workoutData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      workoutType: 'Swim',
      description: '',
      plannedDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
      plannedDuration: '',
      plannedDistanceInMeters: '',
      tss: '',
      timeOfDay: '',
      workoutLocation: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content add-workout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        
        <div className="modal-header">
          <h2 className="modal-title">Add Custom Workout</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Group Ride, Masters Swim"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workoutType">
                Type <span className="required">*</span>
              </label>
              <select
                id="workoutType"
                name="workoutType"
                value={formData.workoutType}
                onChange={handleChange}
              >
                {workoutTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="plannedDate">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="plannedDate"
                name="plannedDate"
                value={formData.plannedDate}
                onChange={handleChange}
                className={errors.plannedDate ? 'error' : ''}
              />
              {errors.plannedDate && <span className="error-message">{errors.plannedDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details about the workout"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plannedDuration">Duration (hours)</label>
              <input
                type="number"
                id="plannedDuration"
                name="plannedDuration"
                value={formData.plannedDuration}
                onChange={handleChange}
                placeholder="e.g., 1.5"
                step="0.25"
                min="0"
                className={errors.plannedDuration ? 'error' : ''}
              />
              {errors.plannedDuration && <span className="error-message">{errors.plannedDuration}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tss">TSS</label>
              <input
                type="number"
                id="tss"
                name="tss"
                value={formData.tss}
                onChange={handleChange}
                placeholder="e.g., 100"
                min="0"
                className={errors.tss ? 'error' : ''}
              />
              {errors.tss && <span className="error-message">{errors.tss}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="plannedDistanceInMeters">Distance (meters)</label>
            <input
              type="number"
              id="plannedDistanceInMeters"
              name="plannedDistanceInMeters"
              value={formData.plannedDistanceInMeters}
              onChange={handleChange}
              placeholder="e.g., 2000 (for swimming)"
              min="0"
              className={errors.plannedDistanceInMeters ? 'error' : ''}
            />
            {errors.plannedDistanceInMeters && <span className="error-message">{errors.plannedDistanceInMeters}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="timeOfDay">Time of Day</label>
              <select
                id="timeOfDay"
                name="timeOfDay"
                value={formData.timeOfDay}
                onChange={handleChange}
              >
                <option value="">Not specified</option>
                {timeOfDayOptions.map(time => (
                  <option key={time} value={time}>{time.charAt(0).toUpperCase() + time.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="workoutLocation">Location</label>
              <select
                id="workoutLocation"
                name="workoutLocation"
                value={formData.workoutLocation}
                onChange={handleChange}
              >
                <option value="">Not specified</option>
                {locationOptions.map(location => (
                  <option key={location} value={location}>{location.charAt(0).toUpperCase() + location.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Workout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddWorkoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialDate: PropTypes.instanceOf(Date)
};

export default AddWorkoutModal;
