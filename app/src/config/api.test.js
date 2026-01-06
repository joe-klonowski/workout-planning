/**
 * Integration tests for API configuration
 */
import { API_ENDPOINTS, apiCall } from './api';

describe('API Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
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
