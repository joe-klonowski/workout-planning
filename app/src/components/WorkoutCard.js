import React from 'react';
import PropTypes from 'prop-types';
import '../styles/WorkoutCard.css';

/**
 * WorkoutCard displays information about a single workout
 * @param {Object} workout - Workout object with title, type, duration, etc.
 * @param {Function} onClick - Optional callback when card is clicked
 * @param {Function} onSelect - Optional callback for selection (checkbox)
 * @param {Boolean} isSelected - Whether this workout is selected
 */
function WorkoutCard({ workout, onClick, onSelect, isSelected = false }) {
  const {
    title = '',
    workoutType = '',
    description = '',
    plannedDuration = 0,
    plannedDistance = 0,
    coachComments = '',
  } = workout || {};

  // Format duration to hours and minutes
  const formatDuration = (hours) => {
    if (hours === 0) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}m`;
    }
  };

  // Format distance based on workout type
  // Swim: yards, Run/Bike: miles
  const formatDistance = (meters) => {
    if (meters === 0) return '';
    
    if (workoutType === 'Swim') {
      // Convert meters to yards (1 meter ≈ 1.094 yards)
      const yards = Math.round(meters * 1.094);
      return `${yards} yd`;
    } else {
      // Convert meters to miles (1 mile = 1609.34 meters)
      const miles = (meters / 1609.34).toFixed(1);
      return `${miles} mi`;
    }
  };

  const workoutTypeColor = getWorkoutTypeColor(workoutType);

  return (
    <div
      className={`workout-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="title-section">
          {onSelect && (
            <input
              type="checkbox"
              className="workout-checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(!isSelected);
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${title}`}
            />
          )}
          <h3 className="workout-title">{title}</h3>
        </div>
        <span className={`workout-type-badge ${workoutTypeColor}`}>
          {workoutType}
        </span>
      </div>

      <div className="card-details">
        {plannedDuration > 0 && (
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{formatDuration(plannedDuration)}</span>
          </div>
        )}
        {plannedDistance > 0 && (
          <div className="detail-item">
            <span className="detail-label">Distance:</span>
            <span className="detail-value">{formatDistance(plannedDistance)}</span>
          </div>
        )}
      </div>

      {description && (
        <details className="description-section">
          <summary>View workout details</summary>
          <p className="description">{description}</p>
        </details>
      )}

      {coachComments && (
        <div className="coach-comments">
          <strong>Coach notes:</strong> {coachComments}
        </div>
      )}
    </div>
  );
}

/**
 * Get CSS class color for workout type
 */
function getWorkoutTypeColor(workoutType) {
  const colors = {
    Run: 'type-run',
    Swim: 'type-swim',
    Bike: 'type-bike',
    Cycling: 'type-bike',
    Strength: 'type-strength',
    'Day Off': 'type-rest',
    'Other': 'type-other',
  };

  return colors[workoutType] || 'type-other';
}

WorkoutCard.propTypes = {
  workout: PropTypes.shape({
    title: PropTypes.string.isRequired,
    workoutType: PropTypes.string.isRequired,
    description: PropTypes.string,
    plannedDuration: PropTypes.number,
    plannedDistance: PropTypes.number,
    coachComments: PropTypes.string,
  }),
  onClick: PropTypes.func,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool,
};

WorkoutCard.defaultProps = {
  workout: null,
  onClick: null,
  onSelect: null,
  isSelected: false,
};

export default WorkoutCard;
