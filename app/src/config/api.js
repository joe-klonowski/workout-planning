/**
 * API configuration for backend connection
 */

// In production build, use empty string for relative URLs (same origin as frontend)
// In development, use localhost:5000
// REACT_APP_API_URL can override this if set during build
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  VERIFY: `${API_BASE_URL}/api/auth/verify`,
  CURRENT_USER: `${API_BASE_URL}/api/auth/me`,
  
  // Workout endpoints
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
  WEEKLY_TARGETS: `${API_BASE_URL}/api/weekly-targets`,
};

/**
 * Make an API call with authentication token
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise} - Fetch promise
 */
export const apiCall = (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

export default API_BASE_URL;

