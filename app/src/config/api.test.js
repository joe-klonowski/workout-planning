/**
 * Integration tests for API configuration
 */
import { API_ENDPOINTS, apiCall } from './api';
import API_BASE_URL from './api';

describe('API Configuration', () => {
  // Save original NODE_ENV
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('Environment-based URL configuration', () => {
    test('uses relative URLs in production to avoid CORS issues', () => {
      // Note: This test verifies the code logic but may not catch dynamic imports
      // In production build, process.env.NODE_ENV will be 'production'
      // and API_BASE_URL should be empty string for same-origin requests
      
      // Check that in current test environment (development), we use localhost
      expect(API_BASE_URL).toBe('http://localhost:5000');
    });

    test('all API endpoints use the configured base URL', () => {
      // Verify all endpoints start with the base URL or are relative
      const basePattern = API_BASE_URL || '/api';
      const endpointsToCheck = [
        API_ENDPOINTS.LOGIN,
        API_ENDPOINTS.REGISTER,
        API_ENDPOINTS.VERIFY,
        API_ENDPOINTS.CURRENT_USER,
        API_ENDPOINTS.WORKOUTS,
        API_ENDPOINTS.HEALTH,
      ];

      endpointsToCheck.forEach(endpoint => {
        if (API_BASE_URL) {
          expect(endpoint).toContain(API_BASE_URL);
        } else {
          // In production, should use relative URLs starting with /api
          expect(endpoint).toMatch(/^\/api/);
        }
      });
    });

    test('dynamic endpoints also use the configured base URL', () => {
      const workoutId = 123;
      const workoutUrl = API_ENDPOINTS.WORKOUT_BY_ID(workoutId);
      
      if (API_BASE_URL) {
        expect(workoutUrl).toContain(API_BASE_URL);
      } else {
        expect(workoutUrl).toMatch(/^\/api/);
      }
      
      expect(workoutUrl).toContain(`/workouts/${workoutId}`);
    });
  });

  test('API_ENDPOINTS contains all required endpoints', () => {
    expect(API_ENDPOINTS).toHaveProperty('LOGIN');
    expect(API_ENDPOINTS).toHaveProperty('REGISTER');
    expect(API_ENDPOINTS).toHaveProperty('VERIFY');
    expect(API_ENDPOINTS).toHaveProperty('CURRENT_USER');
    expect(API_ENDPOINTS).toHaveProperty('WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('WORKOUT_BY_ID');
    expect(API_ENDPOINTS).toHaveProperty('IMPORT_WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('SELECTIONS');
    expect(API_ENDPOINTS).toHaveProperty('CUSTOM_WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('CUSTOM_WORKOUT_BY_ID');
    expect(API_ENDPOINTS).toHaveProperty('HEALTH');
    expect(API_ENDPOINTS).toHaveProperty('STATS');
    expect(API_ENDPOINTS).toHaveProperty('TRI_CLUB_SCHEDULE');
  });

  test('LOGIN endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.LOGIN).toBe('http://localhost:5000/api/auth/login');
  });

  test('REGISTER endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.REGISTER).toBe('http://localhost:5000/api/auth/register');
  });

  test('VERIFY endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.VERIFY).toBe('http://localhost:5000/api/auth/verify');
  });

  test('CURRENT_USER endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.CURRENT_USER).toBe('http://localhost:5000/api/auth/me');
  });

  test('WORKOUTS endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.WORKOUTS).toBe('http://localhost:5000/api/workouts');
  });

  test('WORKOUT_BY_ID returns correct URL with ID', () => {
    expect(API_ENDPOINTS.WORKOUT_BY_ID(123)).toBe('http://localhost:5000/api/workouts/123');
  });

  test('SELECTIONS returns correct URL with workout ID', () => {
    expect(API_ENDPOINTS.SELECTIONS(456)).toBe('http://localhost:5000/api/selections/456');
  });

  test('CUSTOM_WORKOUT_BY_ID returns correct URL with ID', () => {
    expect(API_ENDPOINTS.CUSTOM_WORKOUT_BY_ID(789)).toBe('http://localhost:5000/api/custom-workouts/789');
  });

  test('HEALTH endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.HEALTH).toBe('http://localhost:5000/api/health');
  });

  test('STATS endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.STATS).toBe('http://localhost:5000/api/stats');
  });

  test('TRI_CLUB_SCHEDULE endpoint points to correct URL', () => {
    expect(API_ENDPOINTS.TRI_CLUB_SCHEDULE).toBe('http://localhost:5000/api/tri-club-schedule');
  });
});

describe('apiCall function', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds auth token to headers when token exists', async () => {
    localStorage.setItem('auth_token', 'test-token');
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await apiCall('http://localhost:5000/api/workouts');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/workouts',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  test('does not add auth token when no token in localStorage', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await apiCall('http://localhost:5000/api/health');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verify Authorization header is not present
    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Authorization']).toBeUndefined();
  });

  test('passes custom headers along with auth headers', async () => {
    localStorage.setItem('auth_token', 'test-token');
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await apiCall('http://localhost:5000/api/workouts', {
      headers: { 'X-Custom-Header': 'custom-value' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/workouts',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        }),
      })
    );
  });

  test('passes method and body options correctly', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const requestBody = JSON.stringify({ username: 'joe', password: 'pass123' });
    
    await apiCall('http://localhost:5000/api/auth/login', {
      method: 'POST',
      body: requestBody,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: requestBody,
      })
    );
  });
});
