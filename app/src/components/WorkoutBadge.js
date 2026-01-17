import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/WorkoutBadge.css';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { formatDuration } from '../utils/workoutFormatters';
import logger from '../utils/logger';

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
  draggedWorkoutId,
  onUpdateTss
}) {
  const style = getWorkoutTypeStyle(workout.workoutType);
  
  // Local state for inline TSS editing
  const [isEditing, setIsEditing] = useState(false);
  const [tssValue, setTssValue] = useState(workout.tss != null ? String(Math.round(workout.tss)) : '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
  
  const handleTssKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      const trimmed = tssValue.trim();
      const newTss = trimmed === '' ? null : Number(trimmed);
      if (isNaN(newTss) && newTss !== null) {
        // invalid number - ignore
        setIsEditing(false);
        return;
      }
      try {
        logger.debug(`WorkoutBadge: Enter pressed for workout ${workout.id}, newTss=${newTss}`);
        if (typeof onUpdateTss === 'function') {
          await onUpdateTss(workout.id, newTss);
        } else {
          logger.warn('WorkoutBadge: onUpdateTss not provided');
        }
      } catch (err) {
        logger.error('WorkoutBadge: Error updating TSS', err);
      } finally {
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setTssValue(workout.tss != null ? String(Math.round(workout.tss)) : '');
      setIsEditing(false);
    }
  };

  const handleTssBlur = () => {
    // cancel editing on blur
    setTssValue(workout.tss != null ? String(Math.round(workout.tss)) : '');
    setIsEditing(false);
  };

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

      {/* TSS badge for planned or completed workouts (not for Strength) */}
      {workout.workoutType !== 'Strength' && (
        <div style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
          {!isEditing ? (
            <span
              className="tss-badge"
              title={workout.tss ? `TSS: ${Math.round(workout.tss)}` : 'No TSS'}
              onClick={(e) => {
                e.stopPropagation();
                setTssValue(workout.tss != null ? String(Math.round(workout.tss)) : '');
                setIsEditing(true);
              }}
            >
              {workout.tss ? `${Math.round(workout.tss)} TSS` : 'NO TSS'}
            </span>
          ) : (
            <input
              ref={inputRef}
              className="tss-input"
              value={tssValue}
              onChange={(e) => setTssValue(e.target.value)}
              onKeyDown={handleTssKeyDown}
              onBlur={handleTssBlur}
              aria-label="Edit TSS"
            />
          )}
        </div>
      )}
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
  onUpdateTss: PropTypes.func,
};

WorkoutBadge.defaultProps = {
  onSelectionToggle: null,
  draggedWorkoutId: null,
  onUpdateTss: null,
};

export default WorkoutBadge;
