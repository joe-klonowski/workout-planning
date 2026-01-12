import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { groupWorkoutsByDate } from '../utils/csvParser';
import { DateOnly } from '../utils/DateOnly';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import WorkoutCard from './WorkoutCard';
import WorkoutDetailModal from './WorkoutDetailModal';
import AddWorkoutModal from './AddWorkoutModal';
import ImportWorkoutModal from './ImportWorkoutModal';
import WeeklySummary from './WeeklySummary';
import DayTimeSlot from './DayTimeSlot';
import WorkoutBadge from './WorkoutBadge';
import CalendarHeader from './CalendarHeader';
import '../styles/Calendar.css';

/**
 * Calendar component displays workouts in a weekly or monthly calendar view
 * @param {Array} workouts - Array of workout objects
 * @param {Object} triClubSchedule - Tri club schedule with weekly events
 * @param {DateOnly} initialDate - Starting date (defaults to today)
 * @param {Function} onWorkoutSelectionToggle - Callback for when user toggles workout selection
 * @param {Function} onWorkoutDateChange - Callback for when user drags workout to a new date
 * @param {Function} onWorkoutTimeOfDayChange - Callback for when user drags workout to a time of day
 * @param {Function} onWorkoutLocationChange - Callback for when user changes workout location
 * @param {Function} onExportToCalendar - Callback for exporting workouts to calendar
 * @param {Function} onAddCustomWorkout - Callback for adding a custom workout
 * @param {Function} onImportWorkouts - Callback for importing workouts from CSV file
 */
function Calendar({ workouts = [], triClubSchedule = null, initialDate = (() => {
  const today = new Date();
  return new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
})(), onWorkoutSelectionToggle, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutLocationChange, onExportToCalendar, onAddCustomWorkout, onImportWorkouts }) {
  const [currentDate, setCurrentDate] = useState(initialDate.toDate());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false);
  const [isImportWorkoutModalOpen, setIsImportWorkoutModalOpen] = useState(false);
  const [addWorkoutInitialDate, setAddWorkoutInitialDate] = useState(null);
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

  // Get the start and end dates of the current week
  const getWeekDateRange = () => {
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return {
      start: new DateOnly(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate()),
      end: new DateOnly(weekEnd.getFullYear(), weekEnd.getMonth() + 1, weekEnd.getDate())
    };
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

  // Convert 24-hour time to 12-hour format with am/pm
  const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    return `${hours12}${period}`;
  };

  // Categorize time into time slot (morning, afternoon, evening)
  const getTimeSlot = (time24) => {
    const hour = parseInt(time24.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'unscheduled';
  };

  // Get tri club events for a specific day, grouped by time slot
  const getTriClubEventsByTimeSlot = (dayDate) => {
    if (!triClubSchedule || !triClubSchedule.schedule) return {
      morning: [],
      afternoon: [],
      evening: [],
      unscheduled: []
    };
    
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayDate.getDay()];
    const events = triClubSchedule.schedule[dayOfWeek] || [];
    
    const grouped = {
      morning: [],
      afternoon: [],
      evening: [],
      unscheduled: []
    };
    
    events.forEach(event => {
      const timeSlot = getTimeSlot(event.time);
      grouped[timeSlot].push({
        ...event,
        formattedTime: formatTime12Hour(event.time)
      });
    });
    
    return grouped;
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
  // Handler for clicking on a workout badge
  const handleWorkoutClick = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  // Render a time slot drop zone with workouts
  const renderTimeSlot = (dayObj, timeSlot, workouts) => {
    const isBeingDraggedOver = draggedWorkout && 
      dragOverDate === dayObj.date.toISOString() && 
      dragOverTimeSlot === timeSlot;
    
    // Get tri club events for this time slot
    const triClubEventsBySlot = getTriClubEventsByTimeSlot(dayObj.date);
    const triClubEvents = triClubEventsBySlot[timeSlot] || [];
    const hasContent = workouts.length > 0 || triClubEvents.length > 0;
    
    return (
      <div
        key={timeSlot}
        className={`time-slot ${timeSlot} ${isBeingDraggedOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, dayObj.date, timeSlot)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dayObj, timeSlot)}
      >
        {hasContent && (
          <div className="time-slot-header">{getTimeOfDayLabel(timeSlot)}</div>
        )}
        {triClubEvents.length > 0 && (
          <div className="tri-club-events">
            {triClubEvents.map((event, idx) => (
              <div key={idx} className="tri-club-event">
                {event.formattedTime} tri club {event.activity.toLowerCase()}
              </div>
            ))}
          </div>
        )}
        <div className="time-slot-workouts">
          {workouts.map((workout, idx) => (
            <WorkoutBadge
              key={idx}
              workout={workout}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onWorkoutClick={() => handleWorkoutClick(workout)}
              onSelectionToggle={onWorkoutSelectionToggle}
              draggedWorkoutId={draggedWorkout?.id}
            />
          ))}
        </div>
        {draggedWorkout && !hasContent && (
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
        <CalendarHeader
          monthYear={monthYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavPrevious={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
          onNavNext={viewMode === 'week' ? goToNextWeek : goToNextMonth}
          onGoToToday={goToToday}
          onOpenImport={() => setIsImportWorkoutModalOpen(true)}
          onOpenAddWorkout={() => {
            setAddWorkoutInitialDate(null);
            setIsAddWorkoutModalOpen(true);
          }}
        />

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
            // Week view rendering - always show time slots with weather
            const workoutGroups = groupWorkoutsByTimeOfDay(dayWorkouts);
            const triClubEventsBySlot = getTriClubEventsByTimeSlot(dayObj.date);
            
            return (
              <div
                key={index}
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
                    onDragOver={(e) => handleDragOver(e, dayObj.date, 'morning')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayObj, 'morning')}
                    onWorkoutDragStart={handleDragStart}
                    onWorkoutDragEnd={handleDragEnd}
                    onWorkoutClick={handleWorkoutClick}
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
                    onDragOver={(e) => handleDragOver(e, dayObj.date, 'afternoon')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayObj, 'afternoon')}
                    onWorkoutDragStart={handleDragStart}
                    onWorkoutDragEnd={handleDragEnd}
                    onWorkoutClick={handleWorkoutClick}
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
                    onDragOver={(e) => handleDragOver(e, dayObj.date, 'evening')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayObj, 'evening')}
                    onWorkoutDragStart={handleDragStart}
                    onWorkoutDragEnd={handleDragEnd}
                    onWorkoutClick={handleWorkoutClick}
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
                      onDragOver={(e) => handleDragOver(e, dayObj.date, 'unscheduled')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayObj, 'unscheduled')}
                      onWorkoutDragStart={handleDragStart}
                      onWorkoutDragEnd={handleDragEnd}
                      onWorkoutClick={handleWorkoutClick}
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
                      {dayWorkouts.map((workout, idx) => (
                        <WorkoutBadge
                          key={idx}
                          workout={workout}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onWorkoutClick={() => handleWorkoutClick(workout)}
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
      
      <AddWorkoutModal 
        isOpen={isAddWorkoutModalOpen}
        onClose={() => setIsAddWorkoutModalOpen(false)}
        onSave={onAddCustomWorkout}
        initialDate={addWorkoutInitialDate}
      />
      
      <ImportWorkoutModal
        isOpen={isImportWorkoutModalOpen}
        onClose={() => setIsImportWorkoutModalOpen(false)}
        onImport={onImportWorkouts}
      />
    </div>

    {viewMode === 'week' && (
      <WeeklySummary 
        workouts={getWorkoutsForCurrentWeek()} 
        weekStartDate={getWeekDateRange().start}
        weekEndDate={getWeekDateRange().end}
        onExportToCalendar={onExportToCalendar}
      />
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
  initialDate: PropTypes.instanceOf(DateOnly),
  onWorkoutSelectionToggle: PropTypes.func,
  onWorkoutDateChange: PropTypes.func,
  onWorkoutTimeOfDayChange: PropTypes.func,
  onWorkoutLocationChange: PropTypes.func,
  onExportToCalendar: PropTypes.func,
  onAddCustomWorkout: PropTypes.func,
  onImportWorkouts: PropTypes.func,
};

Calendar.defaultProps = {
  workouts: [],
  triClubSchedule: null,
  initialDate: (() => {
    const today = new Date();
    return new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
  })(),
};

export default Calendar;
