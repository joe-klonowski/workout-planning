import React from 'react';
import PropTypes from 'prop-types';
import { DateOnly } from '../utils/DateOnly';
import CalendarDay from './CalendarDay';
import '../styles/CalendarGrid.css';

/**
 * CalendarGrid component renders the calendar grid with day-of-week headers
 * and CalendarDay components for each day
 * 
 * @param {Array} days - Array of day objects with date, day, year, month, isCurrentMonth
 * @param {Object} workoutsByDate - Object mapping date strings (YYYY-MM-DD) to workout arrays
 * @param {string} viewMode - 'week' or 'month'
 * @param {Object} triClubSchedule - Tri club schedule with weekly events
 * @param {boolean} showTimeSlots - Whether to show time slots (used for drag-drop state)
 * @param {Object} dragState - Drag state object { draggedWorkout, dragOverDate, dragOverTimeSlot }
 * @param {Function} onDragOver - Drag over handler
 * @param {Function} onDragLeave - Drag leave handler
 * @param {Function} onDrop - Drop handler
 * @param {Function} onWorkoutClick - Workout click handler
 * @param {Function} onWorkoutSelectionToggle - Workout selection toggle handler
 * @param {Function} onWorkoutDragStart - Workout drag start handler
 * @param {Function} onWorkoutDragEnd - Workout drag end handler
 */
function CalendarGrid({
  days,
  workoutsByDate,
  viewMode,
  triClubSchedule,
  showTimeSlots,
  dragState,
  onDragOver,
  onDragLeave,
  onDrop,
  onWorkoutClick,
  onWorkoutSelectionToggle,
  onWorkoutDragStart,
  onWorkoutDragEnd
}) {
  /**
   * Get workouts for a specific day
   * @param {number} day - Day of month
   * @param {number} dayYear - Year
   * @param {number} dayMonth - Month (0-indexed)
   * @returns {Array} Array of workouts for the day, sorted with selected first
   */
  const getWorkoutsForDay = (day, dayYear, dayMonth) => {
    if (!day) return [];
    // Create the date string in YYYY-MM-DD format without timezone conversion
    const dateStr = `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayWorkouts = workoutsByDate[dateStr] || [];
    
    // Sort workouts: selected first, then unselected at bottom
    return dayWorkouts.sort((a, b) => {
      // If both have same selection status, maintain original order
      if (a.isSelected === b.isSelected) return 0;
      // Selected workouts come first (isSelected = true should come before false)
      return a.isSelected ? -1 : 1;
    });
  };

  return (
    <>
      <div className="day-of-week-headers">
        <div className="day-of-week">Mon</div>
        <div className="day-of-week">Tue</div>
        <div className="day-of-week">Wed</div>
        <div className="day-of-week">Thu</div>
        <div className="day-of-week">Fri</div>
        <div className="day-of-week">Sat</div>
        <div className="day-of-week">Sun</div>
      </div>

      <div className={`calendar-grid ${viewMode} ${showTimeSlots ? 'dragging' : ''}`}>
        {days.map((dayObj, index) => {
          const dayWorkouts = getWorkoutsForDay(dayObj.day, dayObj.year, dayObj.month);
          const isToday = dayObj.date.toDateString() === new Date().toDateString();
          
          return (
            <CalendarDay
              key={index}
              dayObj={dayObj}
              workouts={dayWorkouts}
              triClubSchedule={triClubSchedule}
              viewMode={viewMode}
              isToday={isToday}
              showTimeSlots={showTimeSlots}
              dragState={dragState}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onWorkoutClick={onWorkoutClick}
              onWorkoutSelectionToggle={onWorkoutSelectionToggle}
              onWorkoutDragStart={onWorkoutDragStart}
              onWorkoutDragEnd={onWorkoutDragEnd}
            />
          );
        })}
      </div>
    </>
  );
}

CalendarGrid.propTypes = {
  days: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.number.isRequired,
      year: PropTypes.number.isRequired,
      month: PropTypes.number.isRequired,
      date: PropTypes.instanceOf(Date).isRequired,
      isCurrentMonth: PropTypes.bool.isRequired,
    })
  ).isRequired,
  workoutsByDate: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        title: PropTypes.string.isRequired,
        workoutType: PropTypes.string.isRequired,
        workoutDate: PropTypes.instanceOf(DateOnly).isRequired,
        originallyPlannedDay: PropTypes.string.isRequired,
        workoutDescription: PropTypes.string,
        plannedDuration: PropTypes.number,
        plannedDistanceInMeters: PropTypes.number,
        coachComments: PropTypes.string,
        isSelected: PropTypes.bool,
        timeOfDay: PropTypes.string,
        workoutLocation: PropTypes.string,
      })
    )
  ).isRequired,
  viewMode: PropTypes.oneOf(['week', 'month']).isRequired,
  triClubSchedule: PropTypes.shape({
    effective_date: PropTypes.string,
    schedule: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          time: PropTypes.string.isRequired,
          activity: PropTypes.string.isRequired,
        })
      )
    ),
  }),
  showTimeSlots: PropTypes.bool.isRequired,
  dragState: PropTypes.shape({
    draggedWorkout: PropTypes.object,
    dragOverDate: PropTypes.string,
    dragOverTimeSlot: PropTypes.string,
  }).isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onWorkoutClick: PropTypes.func.isRequired,
  onWorkoutSelectionToggle: PropTypes.func.isRequired,
  onWorkoutDragStart: PropTypes.func.isRequired,
  onWorkoutDragEnd: PropTypes.func.isRequired,
};

export default CalendarGrid;
