import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  // Set up mock authentication
  localStorage.setItem('auth_token', 'test-token');
  localStorage.setItem('user_info', JSON.stringify({ id: 1, username: 'testuser' }));
  
  // Mock fetch for all API calls
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/auth/verify')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ valid: true, user_id: 1 }),
      });
    } else if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, username: 'testuser' }),
      });
    } else if (url.includes('/api/workouts')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ workouts: [], count: 0 }),
      });
    } else if (url.includes('/api/tri-club-schedule')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
      });
    } else if (url.includes('/api/weekly-targets')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
    } else if (url.includes('/api/weather/by-time-of-day')) {
      // Return a simple hourly forecast object keyed by time of day
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          morning: { weather_code: 0, temperature: 60, rain_probability: 0, windspeed: 5 },
          afternoon: { weather_code: 1, temperature: 65, rain_probability: 10, windspeed: 6 },
          evening: { weather_code: 2, temperature: 55, rain_probability: 5, windspeed: 4 }
        }),
      });
    } else if (url.includes('/api/weather/')) {
      // Daily forecast endpoint
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ weather_code: 0, temperature: 60, rain_probability: 0, windspeed: 5 }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

test('renders the Workout Planner title', async () => {
  render(<App />);
  
  // This should resolve quickly (10s of ms, not seconds)
  expect(await screen.findByText('Workout Planner')).toBeInTheDocument();
});

test('renders the app description', async () => {
  render(<App />);
  
  expect(await screen.findByText('Plan your workouts from TrainingPeaks')).toBeInTheDocument();
});
