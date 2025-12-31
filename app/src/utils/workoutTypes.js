/**
 * Workout type styling utilities
 * Provides colors, icons, and display information for different workout types
 */

export const WORKOUT_TYPES = {
  SWIM: 'Swim',
  RUN: 'Run',
  BIKE: 'Bike',
  STRENGTH: 'Strength',
  DAY_OFF: 'Day Off',
  OTHER: 'Other',
};

/**
 * Get styling information for a workout type
 * @param {string} workoutType - The workout type from the CSV
 * @returns {Object} Object with color, icon, and label
 */
export function getWorkoutTypeStyle(workoutType) {
  const styles = {
    [WORKOUT_TYPES.SWIM]: {
      color: '#0066CC',
      backgroundColor: '#E3F2FD',
      icon: '🏊',
      label: 'Swim',
    },
    [WORKOUT_TYPES.RUN]: {
      color: '#D32F2F',
      backgroundColor: '#FFEBEE',
      icon: '🏃',
      label: 'Run',
    },
    [WORKOUT_TYPES.BIKE]: {
      color: '#F57C00',
      backgroundColor: '#FFF3E0',
      icon: '🚴',
      label: 'Bike',
    },
    [WORKOUT_TYPES.STRENGTH]: {
      color: '#6D28D9',
      backgroundColor: '#F3E5F5',
      icon: '💪',
      label: 'Strength',
    },
    [WORKOUT_TYPES.DAY_OFF]: {
      color: '#558B2F',
      backgroundColor: '#F1F8E9',
      icon: '😴',
      label: 'Rest',
    },
    [WORKOUT_TYPES.OTHER]: {
      color: '#555555',
      backgroundColor: '#EEEEEE',
      icon: '📋',
      label: 'Other',
    },
  };

  return styles[workoutType] || styles[WORKOUT_TYPES.OTHER];
}

/**
 * Get just the icon for a workout type
 * @param {string} workoutType - The workout type from the CSV
 * @returns {string} The emoji icon
 */
export function getWorkoutIcon(workoutType) {
  return getWorkoutTypeStyle(workoutType).icon;
}

/**
 * Get just the color for a workout type
 * @param {string} workoutType - The workout type from the CSV
 * @returns {string} The color hex code
 */
export function getWorkoutColor(workoutType) {
  return getWorkoutTypeStyle(workoutType).color;
}
