import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { groupWorkoutsByDate } from '../utils/csvParser';
import { DateOnly } from '../utils/DateOnly';
import WorkoutDetailModal from './WorkoutDetailModal';
import AddWorkoutModal from './AddWorkoutModal';
import ImportWorkoutModal from './ImportWorkoutModal';
import WeeklySummary from './WeeklySummary';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import ExportModal from './ExportModal';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { useCalendarDragDrop } from '../hooks/useCalendarDragDrop';
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
})(), onWorkoutSelectionToggle, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutLocationChange, onExportToCalendar, onAddCustomWorkout, onImportWorkouts, onUpdateTss }) {
  // Use custom hooks for navigation and drag-drop
  const navigation = useCalendarNavigation(initialDate);
  const dragDrop = useCalendarDragDrop();
  
  // Local component state
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false);
  const [isImportWorkoutModalOpen, setIsImportWorkoutModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [addWorkoutInitialDate, setAddWorkoutInitialDate] = useState(null);

  // Source filters state
  const [filters, setFilters] = useState({ showFriel: true, showTriClub: true, showOther: true });

  // Update selectedWorkout when workouts array changes (e.g., location update)
  useEffect(() => {
    if (selectedWorkout && selectedWorkout.id) {
      const updatedWorkout = workouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout) {
        setSelectedWorkout(updatedWorkout);
      }
    }
  }, [workouts, selectedWorkout]);

  // Helper: detect Friel workout titles
  // Friel workouts usually start with two uppercase letters followed by one of:
  //  - digits and a dot (e.g., "SS1. ...")
  //  - a comma (e.g., "AA, 3-4 sets")
  //  - a space followed by digits (less common)
  const isFrielWorkout = (w) => {
    if (!w || !w.title) return false;
    const t = w.title.trim();
    return /^[A-Z]{2}(?:\d+\.|,|\s+\d)/.test(t);
  };

  // Apply source filters to workouts
  const filteredWorkouts = workouts.filter(w => {
    // Custom workouts are "other"
    if (w.isCustom) {
      return filters.showOther;
    }

    // Friel workouts use a title pattern
    if (isFrielWorkout(w)) {
      return filters.showFriel;
    }

    // Otherwise, consider it tri club
    return filters.showTriClub;
  });

  // Group workouts by date
  const workoutsByDate = groupWorkoutsByDate(filteredWorkouts);

  // Get current date from navigation hook
  const currentDate = navigation.currentDate;

  // Get the first day of the month and number of days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Convert to Monday-start week (0 = Monday, 6 = Sunday)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Wrapper for handleDrop to pass callbacks
  const handleDrop = (e, dayObj, timeSlot = null) => {
    dragDrop.handleDrop(e, dayObj, timeSlot, onWorkoutDateChange, onWorkoutTimeOfDayChange);
  };

  // Handler for clicking on a workout badge
  const handleWorkoutClick = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
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
      const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      const dayWorkouts = workoutsByDate[dateStr] || [];
      weekWorkouts.push(...dayWorkouts);
    }
    
    return weekWorkouts;
  };

  // Get the start and end dates of the current week
  // Memoize to prevent unnecessary re-creation of DateOnly objects
  const weekDateRange = useMemo(() => {
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return {
      start: new DateOnly(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate()),
      end: new DateOnly(weekEnd.getFullYear(), weekEnd.getMonth() + 1, weekEnd.getDate())
    };
  }, [currentDate]);

  return (
    <div className="calendar-wrapper">
      <div className="calendar">
        <CalendarHeader
          monthYear={monthYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavPrevious={viewMode === 'week' ? navigation.goToPreviousWeek : navigation.goToPreviousMonth}
          onNavNext={viewMode === 'week' ? navigation.goToNextWeek : navigation.goToNextMonth}
          onGoToToday={navigation.goToToday}
          onOpenImport={() => setIsImportWorkoutModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenAddWorkout={() => {
            setAddWorkoutInitialDate(null);
            setIsAddWorkoutModalOpen(true);
          }}
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters)}
        />

        <CalendarGrid
          days={days}
          workoutsByDate={workoutsByDate}
          viewMode={viewMode}
          triClubSchedule={triClubSchedule}
          showTimeSlots={dragDrop.showTimeSlots}
          dragState={{
            draggedWorkout: dragDrop.draggedWorkout,
            dragOverDate: dragDrop.dragOverDate,
            dragOverTimeSlot: dragDrop.dragOverTimeSlot
          }}
          onDragOver={dragDrop.handleDragOver}
          onDragLeave={dragDrop.handleDragLeave}
          onDrop={handleDrop}
          onWorkoutClick={handleWorkoutClick}
          onWorkoutSelectionToggle={onWorkoutSelectionToggle}
          onWorkoutDragStart={dragDrop.handleDragStart}
          onWorkoutDragEnd={dragDrop.handleDragEnd}
          onUpdateTss={onUpdateTss}
        />

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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={async (dateRange) => {
          if (onExportToCalendar) {
            await onExportToCalendar(dateRange);
          }
        }}
        defaultStartDate={weekDateRange.start}
        defaultEndDate={weekDateRange.end}
      />
    </div>

    {viewMode === 'week' && (
      <WeeklySummary 
        workouts={getWorkoutsForCurrentWeek()} 
        weekStartDate={weekDateRange.start}
        weekEndDate={weekDateRange.end}
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
  onUpdateTss: PropTypes.func,
};

Calendar.defaultProps = {
  onWorkoutSelectionToggle: null,
  onWorkoutDateChange: null,
  onWorkoutTimeOfDayChange: null,
  onWorkoutLocationChange: null,
  onExportToCalendar: null,
  onAddCustomWorkout: null,
  onImportWorkouts: null,
  onUpdateTss: null,
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
