/**
 * API configuration for backend connection
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  WORKOUTS: `${API_BASE_URL}/api/workouts`,
  WORKOUT_BY_ID: (id) => `${API_BASE_URL}/api/workouts/${id}`,
  IMPORT_WORKOUTS: `${API_BASE_URL}/api/workouts/import`,
  SELECTIONS: (workoutId) => `${API_BASE_URL}/api/selections/${workoutId}`,
  CUSTOM_WORKOUTS: `${API_BASE_URL}/api/custom-workouts`,
  CUSTOM_WORKOUT_BY_ID: (id) => `${API_BASE_URL}/api/custom-workouts/${id}`,
  HEALTH: `${API_BASE_URL}/api/health`,
  STATS: `${API_BASE_URL}/api/stats`,
  EXPORT_TO_CALENDAR: `${API_BASE_URL}/api/export/calendar`,
  TRI_CLUB_SCHEDULE: `${API_BASE_URL}/api/tri-club-schedule`,
};

export default API_BASE_URL;
