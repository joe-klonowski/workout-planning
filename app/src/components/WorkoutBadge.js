import React from 'react';
import PropTypes from 'prop-types';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { formatDuration } from '../utils/workoutFormatters';

/**
 * WorkoutBadge component displays a single workout badge with drag-and-drop support
 * @param {Object} workout - The workout object to display
 * @param {Function} onDragStart - Handler for drag start event
 * @param {Function} onDragEnd - Handler for drag end event
 * @param {Function} onWorkoutClick - Handler for clicking on the workout
 * @param {Function} onSelectionToggle - Handler for toggling workout selection
 * @param {string|number} draggedWorkoutId - ID of the currently dragged workout
 */
function WorkoutBadge({ 
  workout, 
  onDragStart, 
  onDragEnd, 
  onWorkoutClick, 
  onSelectionToggle, 
  draggedWorkoutId 
}) {
  const style = getWorkoutTypeStyle(workout.workoutType);
  
  // Helper to get location display info
  const getLocationDisplay = () => {
    if (!workout.workoutLocation) return null;
    
    const locationEmojis = {
      'indoor': '🏠',
      'outdoor': '🌤️'
    };
    
    const emoji = locationEmojis[workout.workoutLocation.toLowerCase()] || '';
    
    return { emoji };
  };
  
  const locationDisplay = getLocationDisplay();
  
  return (
    <div
      className={`workout-badge ${!workout.isSelected ? 'unselected' : ''}`}
      style={{
        backgroundColor: style.backgroundColor,
        borderLeft: `4px solid ${style.color}`,
        cursor: draggedWorkoutId === workout.id ? 'grabbing' : 'grab',
        opacity: workout.isSelected ? 1 : 0.5,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      draggable={true}
      onDragStart={(e) => onDragStart(e, workout)}
      onDragEnd={onDragEnd}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="workout-icon">{style.icon}</span>
          {workout.plannedDuration > 0 && (
            <span className="workout-duration" style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#666',
              backgroundColor: '#f0f0f0',
              padding: '2px 6px',
              borderRadius: '8px',
              whiteSpace: 'nowrap'
            }}>
              {formatDuration(workout.plannedDuration)}
            </span>
          )}
          {locationDisplay && workout.workoutType === 'Bike' && (
            <span className="workout-location" style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#1976d2',
              backgroundColor: '#e3f2fd',
              padding: '2px 6px',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <span style={{ fontSize: '10px' }}>{locationDisplay.emoji}</span>
              <span>{locationDisplay.label}</span>
            </span>
          )}
        </div>
        {onSelectionToggle && (
          <button
            className={`selection-button ${workout.isSelected ? 'remove' : 'add'}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectionToggle(workout.id, !workout.isSelected);
            }}
            aria-label={workout.isSelected ? 'Remove from plan' : 'Add to plan'}
            title={workout.isSelected ? 'Remove from plan' : 'Add to plan'}
          >
            {workout.isSelected ? '✕' : '+'}
          </button>
        )}
      </div>
      <div
        onClick={onWorkoutClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onWorkoutClick();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className="workout-title">{workout.title}</span>
      </div>
    </div>
  );
}

WorkoutBadge.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    workoutType: PropTypes.string.isRequired,
    plannedDuration: PropTypes.number,
    workoutLocation: PropTypes.string,
    isSelected: PropTypes.bool,
  }).isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onWorkoutClick: PropTypes.func.isRequired,
  onSelectionToggle: PropTypes.func,
  draggedWorkoutId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

WorkoutBadge.defaultProps = {
  onSelectionToggle: null,
  draggedWorkoutId: null,
};

export default WorkoutBadge;
