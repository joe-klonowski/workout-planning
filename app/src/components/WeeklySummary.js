import React from 'react';
import PropTypes from 'prop-types';
import { DateOnly } from '../utils/DateOnly';
import '../styles/WeeklySummary.css';

/**
 * WeeklySummary component displays a summary of workouts for a given week
 * Shows total hours and breakdown by workout type
 * @param {Array} workouts - Array of workout objects for the week
 */
function WeeklySummary({ workouts = [] }) {
  // Filter for selected workouts only
  const selectedWorkouts = workouts.filter(w => w.isSelected);

  // Calculate total hours
  const totalHours = selectedWorkouts.reduce((sum, w) => sum + (w.plannedDuration || 0), 0);

  // Calculate hours by workout type
  const workoutTypeStats = {};
  selectedWorkouts.forEach(workout => {
    let type = workout.workoutType;
    // Map unknown types to 'Other'
    if (!['Swim', 'Bike', 'Run', 'Strength'].includes(type)) {
      type = 'Other';
    }
    if (!workoutTypeStats[type]) {
      workoutTypeStats[type] = {
        hours: 0,
        distance: 0,
        count: 0
      };
    }
    workoutTypeStats[type].hours += workout.plannedDuration || 0;
    workoutTypeStats[type].distance += workout.plannedDistanceInMeters || 0;
    workoutTypeStats[type].count += 1;
  });

  // Format duration to hours and minutes
  const formatDuration = (hours) => {
    if (hours === 0) return '0h';
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

  // Format distance (meters to km/miles)
  const formatDistance = (meters, workoutType) => {
    if (meters === 0) return null;
    
    if (workoutType === 'Swim') {
      // For swimming, show in meters (more common)
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
      }
      return `${Math.round(meters)} m`;
    } else {
      // For running/biking, show in km
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Get icon for workout type
  const getWorkoutIcon = (type) => {
    const icons = {
      'Swim': '🏊',
      'Bike': '🚴',
      'Run': '🏃',
      'Strength': '💪',
      'Other': '📋'
    };
    return icons[type] || '📋';
  };

  // Order workout types for consistent display
  const orderedTypes = ['Swim', 'Bike', 'Run', 'Strength', 'Other'];
  const displayTypes = orderedTypes.filter(type => workoutTypeStats[type]);

  return (
    <div className="weekly-summary">
      <div className="summary-header">
        <h3>Week Summary</h3>
      </div>

      <div className="summary-section total-hours">
        <div className="summary-label">Total Hours</div>
        <div className="summary-value large">{formatDuration(totalHours)}</div>
        <div className="summary-detail">{selectedWorkouts.length} workouts</div>
      </div>

      {displayTypes.length > 0 && (
        <div className="summary-section breakdown">
          <div className="summary-label">By Type</div>
          <div className="breakdown-list">
            {displayTypes.map(type => {
              const stats = workoutTypeStats[type];
              const distance = formatDistance(stats.distance, type);
              
              return (
                <div key={type} className="breakdown-item">
                  <div className="breakdown-header">
                    <span className="breakdown-icon">{getWorkoutIcon(type)}</span>
                    <span className="breakdown-type">{type}</span>
                  </div>
                  <div className="breakdown-stats">
                    <div className="breakdown-stat">
                      <span className="stat-label">Duration:</span>
                      <span className="stat-value">{formatDuration(stats.hours)}</span>
                    </div>
                    {distance && (
                      <div className="breakdown-stat">
                        <span className="stat-label">Distance:</span>
                        <span className="stat-value">{distance}</span>
                      </div>
                    )}
                    <div className="breakdown-stat">
                      <span className="stat-label">Count:</span>
                      <span className="stat-value">{stats.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedWorkouts.length === 0 && (
        <div className="summary-section empty-state">
          <div className="empty-icon">🏖️</div>
          <div className="empty-text">No workouts planned</div>
        </div>
      )}
    </div>
  );
}

WeeklySummary.propTypes = {
  workouts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string.isRequired,
      workoutType: PropTypes.string.isRequired,
      workoutDate: PropTypes.instanceOf(DateOnly).isRequired,
      plannedDuration: PropTypes.number,
      plannedDistanceInMeters: PropTypes.number,
      isSelected: PropTypes.bool,
    })
  ),
};

WeeklySummary.defaultProps = {
  workouts: [],
};

export default WeeklySummary;
