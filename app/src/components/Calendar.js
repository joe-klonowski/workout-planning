import React, { useState } from 'react';
import { groupWorkoutsByDate } from '../utils/csvParser';
import { DateOnly } from '../utils/DateOnly';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import WorkoutCard from './WorkoutCard';
import WorkoutDetailModal from './WorkoutDetailModal';
import '../styles/Calendar.css';

/**
 * Calendar component displays workouts in a weekly or monthly calendar view
 * @param {Array} workouts - Array of workout objects
 * @param {DateOnly} initialDate - Starting date (defaults to today)
 */
function Calendar({ workouts = [], initialDate = (() => {
  const today = new Date();
  return new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
})() }) {
  const [currentDate, setCurrentDate] = useState(initialDate.toDate());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        date: new Date(dayDate)
      });
    }
  } else {
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
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
    return workoutsByDate[dateStr] || [];
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
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

      <div className="day-of-week-headers">
        <div className="day-of-week">Mon</div>
        <div className="day-of-week">Tue</div>
        <div className="day-of-week">Wed</div>
        <div className="day-of-week">Thu</div>
        <div className="day-of-week">Fri</div>
        <div className="day-of-week">Sat</div>
        <div className="day-of-week">Sun</div>
      </div>

      <div className={`calendar-grid ${viewMode}`}>
        {days.map((dayObj, index) => {
          if (viewMode === 'week') {
            // Week view rendering
            const dayWorkouts = getWorkoutsForDay(dayObj.day, dayObj.year, dayObj.month);
            const isToday =
              dayObj.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`calendar-day ${
                  isToday ? 'is-today' : ''
                }`}
              >
                <>
                  <div className="day-number">{dayObj.day}</div>
                  <div className="workouts-container">
                    {dayWorkouts.length > 0 ? (
                      <div className="workouts-list">
                        {dayWorkouts.map((workout, idx) => {
                          const style = getWorkoutTypeStyle(workout.workoutType);
                          return (
                            <div
                              key={idx}
                              className="workout-badge"
                              onClick={() => {
                                setSelectedWorkout(workout);
                                setIsModalOpen(true);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedWorkout(workout);
                                  setIsModalOpen(true);
                                }
                              }}
                              style={{
                                backgroundColor: style.backgroundColor,
                                borderLeft: `4px solid ${style.color}`,
                                cursor: 'pointer',
                              }}
                            >
                              <span className="workout-icon">{style.icon}</span>
                              <span className="workout-title">{workout.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-workouts">Rest day</div>
                    )}
                  </div>
                </>
              </div>
            );
          } else {
            // Month view rendering
            const dayWorkouts = dayObj ? getWorkoutsForDay(dayObj, year, month) : [];
            const isToday =
              dayObj &&
              new Date(year, month, dayObj).toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`calendar-day ${dayObj ? 'has-date' : 'empty'} ${
                  isToday ? 'is-today' : ''
                }`}
              >
                {dayObj && (
                  <>
                    <div className="day-number">{dayObj}</div>
                    <div className="workouts-container">
                      {dayWorkouts.length > 0 ? (
                        <div className="workouts-list">
                          {dayWorkouts.map((workout, idx) => {
                            const style = getWorkoutTypeStyle(workout.workoutType);
                            return (
                              <div
                                key={idx}
                                className="workout-badge"
                                onClick={() => {
                                  setSelectedWorkout(workout);
                                  setIsModalOpen(true);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setSelectedWorkout(workout);
                                    setIsModalOpen(true);
                                  }
                                }}
                                style={{
                                  backgroundColor: style.backgroundColor,
                                  borderLeft: `4px solid ${style.color}`,
                                  cursor: 'pointer',
                                }}
                              >
                                <span className="workout-icon">{style.icon}</span>
                                <span className="workout-title">{workout.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="no-workouts">Rest day</div>
                      )}
                    </div>
                  </>
                )}
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
      />
    </div>
  );
}

export default Calendar;
