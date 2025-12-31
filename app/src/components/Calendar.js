import React, { useState } from 'react';
import { groupWorkoutsByDate } from '../utils/csvParser';
import WorkoutCard from './WorkoutCard';
import '../styles/Calendar.css';

/**
 * Calendar component displays workouts in a monthly calendar view
 * @param {Array} workouts - Array of workout objects
 * @param {Date} initialDate - Starting date (defaults to today)
 */
function Calendar({ workouts = [], initialDate = new Date() }) {
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));

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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar grid
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // Month and year display
  const monthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Get workouts for a specific day
  const getWorkoutsForDay = (day) => {
    if (!day) return [];
    // Create the date string in YYYY-MM-DD format without timezone conversion
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutsByDate[dateStr] || [];
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="nav-button">
          ← Previous
        </button>
        <h2 className="month-year">{monthYear}</h2>
        <button onClick={goToNextMonth} className="nav-button">
          Next →
        </button>
        <button onClick={goToToday} className="today-button">
          Today
        </button>
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

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dayWorkouts = day ? getWorkoutsForDay(day) : [];
          const isToday =
            day &&
            new Date(year, month, day).toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`calendar-day ${day ? 'has-date' : 'empty'} ${
                isToday ? 'is-today' : ''
              }`}
            >
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="workouts-container">
                    {dayWorkouts.length > 0 ? (
                      <div className="workout-count">{dayWorkouts.length} workout{dayWorkouts.length !== 1 ? 's' : ''}</div>
                    ) : (
                      <div className="no-workouts">Rest day</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
