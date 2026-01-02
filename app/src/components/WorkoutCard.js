import React from 'react';
import PropTypes from 'prop-types';
import '../styles/WorkoutCard.css';

/**
 * WorkoutCard displays information about a single workout
 * @param {Object} workout - Workout object with title, type, duration, etc.
 * @param {Function} onClick - Optional callback when card is clicked
 * @param {Function} onSelectionToggle - Callback for when selection button is clicked
 * @param {Boolean} isSelected - Whether this workout is selected/planned
 */
function WorkoutCard({ workout, onClick, onSelectionToggle, isSelected = true }) {
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

  const workoutTypeEmoji = getWorkoutTypeEmoji(workoutType);

  const handleSelectionClick = (e) => {
    e.stopPropagation();
    if (onSelectionToggle) {
      onSelectionToggle(!isSelected);
    }
  };

  return (
    <div
      className={`workout-card ${!isSelected ? 'unselected' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span className="workout-type-icon" title={workoutType}>
          {workoutTypeEmoji}
        </span>
        {onSelectionToggle && (
          <button
            className={`selection-button ${isSelected ? 'remove' : 'add'}`}
            onClick={handleSelectionClick}
            aria-label={isSelected ? 'Remove from plan' : 'Add to plan'}
            title={isSelected ? 'Remove from plan' : 'Add to plan'}
          >
            {isSelected ? '✕' : '+'}
          </button>
        )}
      </div>

      <h3 className="workout-title">{title}</h3>

      <div className="card-content">
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
    </div>
  );
}

/**
 * Get emoji icon for workout type
 */
function getWorkoutTypeEmoji(workoutType) {
  const emojis = {
    Run: '🏃',
    Swim: '🏊',
    Bike: '🚴',
    Cycling: '🚴',
    Strength: '💪',
    'Day Off': '😴',
    'Other': '📝',
  };

  return emojis[workoutType] || '📝';
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
  onSelectionToggle: PropTypes.func,
  isSelected: PropTypes.bool,
};

WorkoutCard.defaultProps = {
  workout: null,
  onClick: null,
  onSelectionToggle: null,
  isSelected: true,
};

export default WorkoutCard;
