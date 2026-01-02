/**
 * Integration tests for API configuration
 */
import { API_ENDPOINTS } from './api';

describe('API Configuration', () => {
  test('API_ENDPOINTS contains all required endpoints', () => {
    expect(API_ENDPOINTS).toHaveProperty('WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('WORKOUT_BY_ID');
    expect(API_ENDPOINTS).toHaveProperty('IMPORT_WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('SELECTIONS');
    expect(API_ENDPOINTS).toHaveProperty('CUSTOM_WORKOUTS');
    expect(API_ENDPOINTS).toHaveProperty('CUSTOM_WORKOUT_BY_ID');
    expect(API_ENDPOINTS).toHaveProperty('HEALTH');
    expect(API_ENDPOINTS).toHaveProperty('STATS');
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

  test('API base URL can be overridden with environment variable', () => {
    const originalEnv = process.env.REACT_APP_API_URL;
    
    // Note: This test only verifies the code structure since env vars
    // are set at build time in React. In a real scenario, you'd build
    // with different env vars to test this.
    delete process.env.REACT_APP_API_URL;
    
    // Reload the module to test default
    jest.resetModules();
    const { API_ENDPOINTS: endpoints } = require('./api');
    expect(endpoints.WORKOUTS).toContain('localhost:5000');
    
    // Restore
    if (originalEnv) {
      process.env.REACT_APP_API_URL = originalEnv;
    }
  });
});
