import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { groupWorkoutsByDate } from '../utils/csvParser';
import { DateOnly } from '../utils/DateOnly';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import WorkoutCard from './WorkoutCard';
import WorkoutDetailModal from './WorkoutDetailModal';
import WeeklySummary from './WeeklySummary';
import '../styles/Calendar.css';

/**
 * Calendar component displays workouts in a weekly or monthly calendar view
 * @param {Array} workouts - Array of workout objects
 * @param {DateOnly} initialDate - Starting date (defaults to today)
 * @param {Function} onWorkoutSelectionToggle - Callback for when user toggles workout selection
 * @param {Function} onWorkoutDateChange - Callback for when user drags workout to a new date
 * @param {Function} onWorkoutTimeOfDayChange - Callback for when user drags workout to a time of day
 * @param {Function} onWorkoutLocationChange - Callback for when user changes workout location
 */
function Calendar({ workouts = [], initialDate = (() => {
  const today = new Date();
  return new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
})(), onWorkoutSelectionToggle, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutLocationChange }) {
  const [currentDate, setCurrentDate] = useState(initialDate.toDate());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false); // Separate state to control time slot visibility
  const [dragOverDate, setDragOverDate] = useState(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState(null);

  // Update selectedWorkout when workouts array changes (e.g., location update)
  useEffect(() => {
    if (selectedWorkout && selectedWorkout.id) {
      const updatedWorkout = workouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) {
        setSelectedWorkout(updatedWorkout);
      }
    }
  }, [workouts, selectedWorkout]);

  // Group workouts by date
  const workoutsByDate = groupWorkoutsByDate(workouts);

  // Get the first day of the month and number of days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Convert to Monday-start week (0 = Monday, 6 = Sunday)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Navigation handlers for week view
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and drop handlers
  const handleDragStart = (e, workout) => {
    setDraggedWorkout(workout);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.innerHTML);
    }
    // Add a subtle visual effect
    e.target.style.opacity = '0.4';
    // Show time slots after a tiny delay to let drag operation establish
    setTimeout(() => {
      setShowTimeSlots(true);
    }, 50);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedWorkout(null);
    setShowTimeSlots(false);
    setDragOverDate(null);
    setDragOverTimeSlot(null);
  };

  const handleDragOver = (e, date, timeSlot = null) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverDate(date.toISOString());
    setDragOverTimeSlot(timeSlot);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
    setDragOverTimeSlot(null);
  };

  const handleDrop = (e, dayObj, timeSlot = null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    setDragOverTimeSlot(null);
    setShowTimeSlots(false);
    
    if (!draggedWorkout) {
      setDraggedWorkout(null);
      return;
    }
    
    // Create a Date object for the new date
    const newDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    
    // Compare the actual Date values to see if they're the same day
    const currentDate = draggedWorkout.workoutDate.toDate();
    const sameDay = currentDate.getFullYear() === dayObj.year &&
                    currentDate.getMonth() === dayObj.month &&
                    currentDate.getDate() === dayObj.day;
    
    // Check if time slot changed
    const timeSlotChanged = draggedWorkout.timeOfDay !== timeSlot;
    
    // Update date if changed
    if (!sameDay && onWorkoutDateChange) {
      onWorkoutDateChange(draggedWorkout.id, newDate);
    }
    
    // Update time of day if changed
    if (timeSlotChanged && onWorkoutTimeOfDayChange) {
      onWorkoutTimeOfDayChange(draggedWorkout.id, timeSlot);
    }
    
    setDraggedWorkout(null);
  };

  // Build calendar grid
  const days = [];
  
  if (viewMode === 'week') {
    // For week view, get the Monday of the current week
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    // Add 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      days.push({
        day: dayDate.getDate(),
        year: dayDate.getFullYear(),
        month: dayDate.getMonth(),
        date: new Date(dayDate),
        isCurrentMonth: true // Week view always shows current context
      });
    }
  } else {
    // Add days from previous month before the first day of the current month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDate = new Date(year, month, 0 - i);
      days.push({
        day: prevMonthDate.getDate(),
        year: prevMonthDate.getFullYear(),
        month: prevMonthDate.getMonth(),
        date: new Date(prevMonthDate),
        isCurrentMonth: false
      });
    }
    
    // Add cells for each day of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day: day,
        year: year,
        month: month,
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to complete the last week
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        days.push({
          day: nextMonthDate.getDate(),
          year: nextMonthDate.getFullYear(),
          month: nextMonthDate.getMonth(),
          date: new Date(nextMonthDate),
          isCurrentMonth: false
        });
      }
    }
  }

  // Month and year display
  const monthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Get workouts for a specific day
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

  // Get all workouts for the current week (for weekly summary)
  const getWorkoutsForCurrentWeek = () => {
    if (viewMode !== 'week') return [];
    
    const weekWorkouts = [];
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    // Get workouts for all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayWorkouts = getWorkoutsForDay(
        dayDate.getDate(),
        dayDate.getFullYear(),
        dayDate.getMonth()
      );
      weekWorkouts.push(...dayWorkouts);
    }
    
    return weekWorkouts;
  };

  // Group workouts by time of day
  const groupWorkoutsByTimeOfDay = (workouts) => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
      unscheduled: []
    };
    
    workouts.forEach(workout => {
      const timeOfDay = workout.timeOfDay || 'unscheduled';
      if (groups[timeOfDay]) {
        groups[timeOfDay].push(workout);
      } else {
        groups.unscheduled.push(workout);
      }
    });
    
    return groups;
  };

  // Get label for time of day
  const getTimeOfDayLabel = (timeSlot) => {
    const labels = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Evening',
      unscheduled: 'Unscheduled'
    };
    return labels[timeSlot] || timeSlot;
  };

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

  // Render a workout badge
  const renderWorkoutBadge = (workout, idx) => {
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
        key={idx}
        className={`workout-badge ${!workout.isSelected ? 'unselected' : ''}`}
        style={{
          backgroundColor: style.backgroundColor,
          borderLeft: `4px solid ${style.color}`,
          cursor: draggedWorkout?.id === workout.id ? 'grabbing' : 'grab',
          opacity: workout.isSelected ? 1 : 0.5,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, workout)}
        onDragEnd={handleDragEnd}
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
          {onWorkoutSelectionToggle && (
            <button
              className={`selection-button ${workout.isSelected ? 'remove' : 'add'}`}
              onClick={(e) => {
                e.stopPropagation();
                onWorkoutSelectionToggle(workout.id, !workout.isSelected);
              }}
              aria-label={workout.isSelected ? 'Remove from plan' : 'Add to plan'}
              title={workout.isSelected ? 'Remove from plan' : 'Add to plan'}
            >
              {workout.isSelected ? '✕' : '+'}
            </button>
          )}
        </div>
        <div
          onClick={() => {
            setSelectedWorkout(workout);
            setIsModalOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedWorkout(workout);
              setIsModalOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className="workout-title">{workout.title}</span>
        </div>
      </div>
    );
  };

  // Render a time slot drop zone with workouts
  const renderTimeSlot = (dayObj, timeSlot, workouts) => {
    const isBeingDraggedOver = draggedWorkout && 
      dragOverDate === dayObj.date.toISOString() && 
      dragOverTimeSlot === timeSlot;
    
    return (
      <div
        key={timeSlot}
        className={`time-slot ${timeSlot} ${isBeingDraggedOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, dayObj.date, timeSlot)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dayObj, timeSlot)}
      >
        {workouts.length > 0 && (
          <div className="time-slot-header">{getTimeOfDayLabel(timeSlot)}</div>
        )}
        <div className="time-slot-workouts">
          {workouts.map((workout, idx) => renderWorkoutBadge(workout, idx))}
        </div>
        {draggedWorkout && workouts.length === 0 && (
          <div className="time-slot-placeholder">
            {getTimeOfDayLabel(timeSlot)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar">
        <div className="calendar-header">
          <div className="header-left">
            <button onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth} className="nav-button">
              ← Previous
            </button>
            <h2 className="month-year">{monthYear}</h2>
            <button onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth} className="nav-button">
              Next →
            </button>
            <button onClick={goToToday} className="today-button">
              Today
            </button>
          </div>
          <div className="header-right">
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('week')}
                className={`toggle-button ${viewMode === 'week' ? 'active' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`toggle-button ${viewMode === 'month' ? 'active' : ''}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

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
          
          if (viewMode === 'week') {
            // Week view rendering with time slots when dragging
            if (showTimeSlots) {
              // Show time slot drop zones when dragging
              const workoutGroups = groupWorkoutsByTimeOfDay(dayWorkouts);
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${isToday ? 'is-today' : ''} time-slot-mode`}
                >
                  <div className="day-number">{dayObj.day}</div>
                  <div className="time-slots-container">
                    {renderTimeSlot(dayObj, 'morning', workoutGroups.morning)}
                    {renderTimeSlot(dayObj, 'afternoon', workoutGroups.afternoon)}
                    {renderTimeSlot(dayObj, 'evening', workoutGroups.evening)}
                    {renderTimeSlot(dayObj, 'unscheduled', workoutGroups.unscheduled)}
                  </div>
                </div>
              );
            } else {
              // Normal view when not dragging - group by time of day if any have times
              const workoutGroups = groupWorkoutsByTimeOfDay(dayWorkouts);
              const hasTimedWorkouts = workoutGroups.morning.length > 0 || 
                                      workoutGroups.afternoon.length > 0 || 
                                      workoutGroups.evening.length > 0;
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${isToday ? 'is-today' : ''}`}
                >
                  <div className="day-number">{dayObj.day}</div>
                  <div className="workouts-container">
                    {dayWorkouts.length > 0 ? (
                      hasTimedWorkouts ? (
                        <div className="time-grouped-workouts">
                          {workoutGroups.morning.length > 0 && (
                            <div className="time-group">
                              <div className="time-group-header">🌅 Morning</div>
                              {workoutGroups.morning.map((workout, idx) => renderWorkoutBadge(workout, `morning-${idx}`))}
                            </div>
                          )}
                          {workoutGroups.afternoon.length > 0 && (
                            <div className="time-group">
                              <div className="time-group-header">☀️ Afternoon</div>
                              {workoutGroups.afternoon.map((workout, idx) => renderWorkoutBadge(workout, `afternoon-${idx}`))}
                            </div>
                          )}
                          {workoutGroups.evening.length > 0 && (
                            <div className="time-group">
                              <div className="time-group-header">🌙 Evening</div>
                              {workoutGroups.evening.map((workout, idx) => renderWorkoutBadge(workout, `evening-${idx}`))}
                            </div>
                          )}
                          {/* Unscheduled workouts shown without time-group box */}
                          {workoutGroups.unscheduled.map((workout, idx) => renderWorkoutBadge(workout, `unscheduled-${idx}`))}
                        </div>
                      ) : (
                        <div className="workouts-list">
                          {dayWorkouts.map((workout, idx) => renderWorkoutBadge(workout, idx))}
                        </div>
                      )
                    ) : (
                      <div className="no-workouts">Rest day</div>
                    )}
                  </div>
                </div>
              );
            }
          } else {
            // Month view rendering - simpler, no time slots in month view
            const isCurrentMonth = dayObj.isCurrentMonth;

            return (
              <div
                key={index}
                className={`calendar-day has-date ${
                  isToday ? 'is-today' : ''
                } ${!isCurrentMonth ? 'other-month' : ''} ${dragOverDate === dayObj.date.toISOString() && !dragOverTimeSlot ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, dayObj.date, null)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayObj, null)}
              >
                <div className="day-number">{dayObj.day}</div>
                <div className="workouts-container">
                  {dayWorkouts.length > 0 ? (
                    <div className="workouts-list">
                      {dayWorkouts.map((workout, idx) => renderWorkoutBadge(workout, idx))}
                    </div>
                  ) : (
                    <div className="no-workouts">Rest day</div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>

      <WorkoutDetailModal
        workout={selectedWorkout}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWorkout(null);
        }}
        onWorkoutLocationChange={onWorkoutLocationChange}
      />
    </div>

    {viewMode === 'week' && (
      <WeeklySummary workouts={getWorkoutsForCurrentWeek()} />
    )}
  </div>
  );
}

Calendar.propTypes = {
  workouts: PropTypes.arrayOf(
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
  ),
  initialDate: PropTypes.instanceOf(DateOnly),
  onWorkoutSelectionToggle: PropTypes.func,
  onWorkoutDateChange: PropTypes.func,
  onWorkoutTimeOfDayChange: PropTypes.func,
  onWorkoutLocationChange: PropTypes.func,
};

Calendar.defaultProps = {
  workouts: [],
  initialDate: (() => {
    const today = new Date();
    return new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
  })(),
};

export default Calendar;
