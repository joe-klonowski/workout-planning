import React from 'react';
import PropTypes from 'prop-types';
import { DateOnly } from '../utils/DateOnly';
import { groupWorkoutsByTimeOfDay, getTimeOfDayLabel } from '../utils/workoutFormatters';
import { getTriClubEventsByTimeSlot } from '../utils/triClubUtils';
import DayTimeSlot from './DayTimeSlot';
import WorkoutBadge from './WorkoutBadge';
import '../styles/Calendar.css';

/**
 * CalendarDay component represents a single day cell in the calendar
 * Works for both week view (with time slots) and month view (simple list)
 * 
 * @param {Object} dayObj - Day object with date, day, year, month, isCurrentMonth
 * @param {Array} workouts - Array of workouts for this day
 * @param {Object} triClubSchedule - Tri club schedule with weekly events
 * @param {string} viewMode - 'week' or 'month'
 * @param {boolean} isToday - Whether this day is today
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
function CalendarDay({
  dayObj,
  workouts,
  triClubSchedule,
  viewMode,
  isToday,
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
  const { draggedWorkout, dragOverDate, dragOverTimeSlot } = dragState;
  
  if (viewMode === 'week') {
    // Week view rendering - always show time slots with weather
    const workoutGroups = groupWorkoutsByTimeOfDay(workouts);
    const triClubEventsBySlot = getTriClubEventsByTimeSlot(dayObj.date, triClubSchedule);
    
    return (
      <div
        className={`calendar-day ${isToday ? 'is-today' : ''} time-slot-mode`}
      >
        <div className="day-number">{dayObj.day}</div>
        <div className="time-slots-container">
          <DayTimeSlot
            dayObj={dayObj}
            timeSlot="morning"
            workouts={workoutGroups.morning}
            triClubEvents={triClubEventsBySlot.morning}
            draggedWorkout={draggedWorkout}
            dragOverDate={dragOverDate}
            dragOverTimeSlot={dragOverTimeSlot}
            onDragOver={(e) => onDragOver(e, dayObj.date, 'morning')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dayObj, 'morning')}
            onWorkoutDragStart={onWorkoutDragStart}
            onWorkoutDragEnd={onWorkoutDragEnd}
            onWorkoutClick={onWorkoutClick}
            onWorkoutSelectionToggle={onWorkoutSelectionToggle}
            getTimeOfDayLabel={getTimeOfDayLabel}
          />
          <DayTimeSlot
            dayObj={dayObj}
            timeSlot="afternoon"
            workouts={workoutGroups.afternoon}
            triClubEvents={triClubEventsBySlot.afternoon}
            draggedWorkout={draggedWorkout}
            dragOverDate={dragOverDate}
            dragOverTimeSlot={dragOverTimeSlot}
            onDragOver={(e) => onDragOver(e, dayObj.date, 'afternoon')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dayObj, 'afternoon')}
            onWorkoutDragStart={onWorkoutDragStart}
            onWorkoutDragEnd={onWorkoutDragEnd}
            onWorkoutClick={onWorkoutClick}
            onWorkoutSelectionToggle={onWorkoutSelectionToggle}
            getTimeOfDayLabel={getTimeOfDayLabel}
          />
          <DayTimeSlot
            dayObj={dayObj}
            timeSlot="evening"
            workouts={workoutGroups.evening}
            triClubEvents={triClubEventsBySlot.evening}
            draggedWorkout={draggedWorkout}
            dragOverDate={dragOverDate}
            dragOverTimeSlot={dragOverTimeSlot}
            onDragOver={(e) => onDragOver(e, dayObj.date, 'evening')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dayObj, 'evening')}
            onWorkoutDragStart={onWorkoutDragStart}
            onWorkoutDragEnd={onWorkoutDragEnd}
            onWorkoutClick={onWorkoutClick}
            onWorkoutSelectionToggle={onWorkoutSelectionToggle}
            getTimeOfDayLabel={getTimeOfDayLabel}
          />
          {workoutGroups.unscheduled.length > 0 && (
            <DayTimeSlot
              dayObj={dayObj}
              timeSlot="unscheduled"
              workouts={workoutGroups.unscheduled}
              triClubEvents={[]}
              draggedWorkout={draggedWorkout}
              dragOverDate={dragOverDate}
              dragOverTimeSlot={dragOverTimeSlot}
              onDragOver={(e) => onDragOver(e, dayObj.date, 'unscheduled')}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, dayObj, 'unscheduled')}
              onWorkoutDragStart={onWorkoutDragStart}
              onWorkoutDragEnd={onWorkoutDragEnd}
              onWorkoutClick={onWorkoutClick}
              onWorkoutSelectionToggle={onWorkoutSelectionToggle}
              getTimeOfDayLabel={getTimeOfDayLabel}
            />
          )}
        </div>
      </div>
    );
  } else {
    // Month view rendering - simpler, no time slots in month view
    const isCurrentMonth = dayObj.isCurrentMonth;
    const isDragOverThisDay = dragOverDate === dayObj.date.toISOString() && !dragOverTimeSlot;

    return (
      <div
        className={`calendar-day has-date ${
          isToday ? 'is-today' : ''
        } ${!isCurrentMonth ? 'other-month' : ''} ${isDragOverThisDay ? 'drag-over' : ''}`}
        onDragOver={(e) => onDragOver(e, dayObj.date, null)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, dayObj, null)}
      >
        <div className="day-number">{dayObj.day}</div>
        <div className="workouts-container">
          {workouts.length > 0 ? (
            <div className="workouts-list">
              {workouts.map((workout, idx) => (
                <WorkoutBadge
                  key={idx}
                  workout={workout}
                  onDragStart={onWorkoutDragStart}
                  onDragEnd={onWorkoutDragEnd}
                  onWorkoutClick={() => onWorkoutClick(workout)}
                  onSelectionToggle={onWorkoutSelectionToggle}
                  draggedWorkoutId={draggedWorkout?.id}
                />
              ))}
            </div>
          ) : (
            <div className="no-workouts">Rest day</div>
          )}
        </div>
      </div>
    );
  }
}

CalendarDay.propTypes = {
  dayObj: PropTypes.shape({
    day: PropTypes.number.isRequired,
    year: PropTypes.number.isRequired,
    month: PropTypes.number.isRequired,
    date: PropTypes.object.isRequired,
    isCurrentMonth: PropTypes.bool,
  }).isRequired,
  workouts: PropTypes.array.isRequired,
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
  viewMode: PropTypes.oneOf(['week', 'month']).isRequired,
  isToday: PropTypes.bool.isRequired,
  showTimeSlots: PropTypes.bool,
  dragState: PropTypes.shape({
    draggedWorkout: PropTypes.object,
    dragOverDate: PropTypes.string,
    dragOverTimeSlot: PropTypes.string,
  }).isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onWorkoutClick: PropTypes.func.isRequired,
  onWorkoutSelectionToggle: PropTypes.func,
  onWorkoutDragStart: PropTypes.func.isRequired,
  onWorkoutDragEnd: PropTypes.func.isRequired,
};

CalendarDay.defaultProps = {
  showTimeSlots: false,
  triClubSchedule: null,
};

export default CalendarDay;
