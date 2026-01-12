import { groupWorkoutsByDate } from './csvParser';

/**
 * Format duration in hours to human-readable string
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration string (e.g., "1h 30m")
 */
export function formatDuration(hours) {
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
}

/**
 * Convert 24-hour time to 12-hour format with am/pm
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2pm")
 */
export function formatTime12Hour(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 || 12;
  return `${hours12}${period}`;
}

/**
 * Categorize time into time slot (morning, afternoon, evening)
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time slot: 'morning', 'afternoon', 'evening', or 'unscheduled'
 */
export function getTimeSlot(time24) {
  const hour = parseInt(time24.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'unscheduled';
}

/**
 * Group workouts by time of day
 * @param {Array} workouts - Array of workout objects
 * @returns {Object} Workouts grouped by time slot
 */
export function groupWorkoutsByTimeOfDay(workouts) {
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
}

/**
 * Get workouts for a specific day
 * @param {number} day - Day of the month
 * @param {number} dayYear - Year
 * @param {number} dayMonth - Month (0-indexed)
 * @param {Object} workoutsByDate - Workouts grouped by date
 * @returns {Array} Array of workouts for the specified day
 */
export function getWorkoutsForDay(day, dayYear, dayMonth, workoutsByDate) {
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
}

/**
 * Get label for time of day
 * @param {string} timeSlot - Time slot identifier
 * @returns {string} Formatted label with emoji
 */
export function getTimeOfDayLabel(timeSlot) {
  const labels = {
    morning: '🌅 Morning',
    afternoon: '☀️ Afternoon',
    evening: '🌙 Evening',
    unscheduled: 'Unscheduled'
  };
  return labels[timeSlot] || timeSlot;
}

/**
 * Get all workouts for a specific week
 * @param {Date} currentDate - Any date within the week
 * @param {Array} workouts - All workouts
 * @returns {Array} Array of workouts for the week
 */
export function getWorkoutsForCurrentWeek(currentDate, workouts) {
  const weekWorkouts = [];
  const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  
  const workoutsByDate = groupWorkoutsByDate(workouts);
  
  // Get workouts for all 7 days of the week
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayWorkouts = getWorkoutsForDay(
      dayDate.getDate(),
      dayDate.getFullYear(),
      dayDate.getMonth(),
      workoutsByDate
    );
    weekWorkouts.push(...dayWorkouts);
  }
  
  return weekWorkouts;
}
