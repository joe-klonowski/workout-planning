/**
 * API configuration for backend connection
 */

// In production (served by Flask), use relative URLs to avoid CORS issues
// In development (React dev server), use localhost:5000
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5000';

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
  
  // Weather endpoints
  WEATHER: `${API_BASE_URL}/api/weather`,
  WEATHER_BY_DATE: (date) => `${API_BASE_URL}/api/weather/${date}`,
  WEATHER_BY_TIME_OF_DAY: (date) => `${API_BASE_URL}/api/weather/by-time-of-day/${date}`,
};

/**
 * Make an API call with authentication token
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise} - Fetch promise
 */
export const apiCall = (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const { timeout = 5000 } = options; // default timeout in ms

  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const signal = controller.signal;

  const fetchOptions = {
    ...options,
    headers,
    signal,
  };

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Ensure timeout is cleared whether fetch resolves or rejects
  return fetch(url, fetchOptions).finally(() => clearTimeout(timeoutId));
};

export default API_BASE_URL;

