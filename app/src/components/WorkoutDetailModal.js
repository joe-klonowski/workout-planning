import React from 'react';
import PropTypes from 'prop-types';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { DateOnly } from '../utils/DateOnly';
import '../styles/WorkoutDetailModal.css';

/**
 * Modal component that displays detailed information about a selected workout
 * @param {Object} workout - Workout object with all details
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 */
function WorkoutDetailModal({ workout, isOpen, onClose }) {
  if (!isOpen || !workout) {
    return null;
  }

  const style = getWorkoutTypeStyle(workout.workoutType);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Handle DateOnly objects
    if (date instanceof DateOnly) {
      return date.toString();
    }
    
    return 'N/A';
  };

  const formatDuration = (hours) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h}h ${m}m`;
  };

  const formatDistance = (meters, type = workout.workoutType) => {
    if (!meters) return 'N/A';
    
    // Sport-specific unit display based on README requirements
    if (type === 'Swim') {
      // Swim: Display in yards (1 meter = 1.09361 yards, so 1 yard = 0.9144 meters)
      return `${(meters / 0.9144).toFixed(0)} yd`;
    } else if (type === 'Run' || type === 'Bike') {
      // Run and Bike: Display in miles (1 mile = 1609.34 meters)
      return `${(meters / 1609.34).toFixed(2)} mi`;
    } else {
      // Default fallback to miles for other types
      return `${(meters / 1609.34).toFixed(2)} mi`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-header" style={{ borderLeftColor: style.color }}>
          <span className="modal-icon">{style.icon}</span>
          <div className="modal-title-section">
            <h2 className="modal-title">{workout.title}</h2>
            <p className="modal-type">
              {style.label} • {formatDate(workout.workoutDate)}
              {workout.isSelected !== undefined && (
                <>
                  {' • '}
                  <span className={`workout-status ${workout.isSelected ? 'planned' : 'not-planned'}`}>
                    {workout.isSelected ? 'Planned' : 'NOT planned'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="modal-body">
          {workout.workoutDescription && (
            <div className="detail-section">
              <h3 className="detail-label">Description</h3>
              <p className="detail-value">{workout.workoutDescription}</p>
            </div>
          )}

          <div className="detail-grid">
            {workout.plannedDuration > 0 && (
              <div className="detail-item">
                <span className="detail-label">Planned Duration</span>
                <span className="detail-value">{formatDuration(workout.plannedDuration)}</span>
              </div>
            )}

            {workout.plannedDistanceInMeters > 0 && (
              <div className="detail-item">
                <span className="detail-label">Planned Distance</span>
                <span className="detail-value">{formatDistance(workout.plannedDistanceInMeters)}</span>
              </div>
            )}

            {workout.actualDistance && (
              <div className="detail-item">
                <span className="detail-label">Actual Distance</span>
                <span className="detail-value">{formatDistance(workout.actualDistance)}</span>
              </div>
            )}

            {workout.heartRateAverage && (
              <div className="detail-item">
                <span className="detail-label">Avg Heart Rate</span>
                <span className="detail-value">{Math.round(workout.heartRateAverage)} bpm</span>
              </div>
            )}

            {workout.heartRateMax && (
              <div className="detail-item">
                <span className="detail-label">Max Heart Rate</span>
                <span className="detail-value">{Math.round(workout.heartRateMax)} bpm</span>
              </div>
            )}

            {workout.powerAverage && (
              <div className="detail-item">
                <span className="detail-label">Avg Power</span>
                <span className="detail-value">{Math.round(workout.powerAverage)} W</span>
              </div>
            )}

            {workout.powerMax && (
              <div className="detail-item">
                <span className="detail-label">Max Power</span>
                <span className="detail-value">{Math.round(workout.powerMax)} W</span>
              </div>
            )}

            {workout.tss && (
              <div className="detail-item">
                <span className="detail-label">TSS</span>
                <span className="detail-value">{Math.round(workout.tss)}</span>
              </div>
            )}

            {workout.if && (
              <div className="detail-item">
                <span className="detail-label">Intensity Factor</span>
                <span className="detail-value">{workout.if.toFixed(2)}</span>
              </div>
            )}
          </div>

          {(workout.coachComments || workout.athleteComments) && (
            <div className="detail-section">
              {workout.coachComments && (
                <div className="comments-block">
                  <h3 className="detail-label">Coach Comments</h3>
                  <p className="detail-value comment-text">{workout.coachComments}</p>
                </div>
              )}

              {workout.athleteComments && (
                <div className="comments-block">
                  <h3 className="detail-label">Your Notes</h3>
                  <p className="detail-value comment-text">{workout.athleteComments}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

WorkoutDetailModal.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string.isRequired,
    workoutType: PropTypes.string.isRequired,
    workoutDate: PropTypes.instanceOf(DateOnly),
    workoutDescription: PropTypes.string,
    plannedDuration: PropTypes.number,
    plannedDistanceInMeters: PropTypes.number,
    actualDistance: PropTypes.number,
    heartRateAverage: PropTypes.number,
    heartRateMax: PropTypes.number,
    powerAverage: PropTypes.number,
    powerMax: PropTypes.number,
    tss: PropTypes.number,
    if: PropTypes.number,
    coachComments: PropTypes.string,
    athleteComments: PropTypes.string,
    isSelected: PropTypes.bool,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

WorkoutDetailModal.defaultProps = {
  workout: null,
};

export default WorkoutDetailModal;
