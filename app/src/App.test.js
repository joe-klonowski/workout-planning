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
        json: () => Promise.resolve({ valid: true, user_id: 1 }),
      });
    } else if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, username: 'testuser' }),
      });
    } else if (url.includes('/api/workouts')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: [], count: 0 }),
      });
    } else if (url.includes('/api/tri-club-schedule')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
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
