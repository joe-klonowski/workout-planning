/**
 * Tests for App component and API integration
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';
import { DateOnly } from './utils/DateOnly';
import { AuthProvider } from './auth/AuthProvider';

// Mock the Calendar component since we're testing App
// Use module-scoped variables to capture callbacks and workouts
let mockCallbacks = {};
let mockWorkoutsReceived = [];
jest.mock('./components/Calendar', () => {
  return function MockCalendar({ workouts, onWorkoutSelectionToggle, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutSelectionUpdate, ...props }) {
    mockCallbacks = { onWorkoutSelectionToggle, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutSelectionUpdate };
    mockWorkoutsReceived = workouts;
    return (
      <div data-testid="mock-calendar">
        <div data-testid="calendar-workout-count">{workouts.length}</div>
        {workouts.map((workout, index) => (
          <div key={index} data-testid={`workout-${index}`}>
            {workout.title}
          </div>
        ))}
      </div>
    );
  };
});

// Helper function to create a comprehensive fetch mock that handles all endpoints
const createFetchMock = (workouts = [], triClubSchedule = null) => {
  return jest.fn((url) => {
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
        json: () => Promise.resolve({ workouts, count: workouts.length }),
      });
    } else if (url.includes('/api/tri-club-schedule')) {
      return Promise.resolve({
        ok: triClubSchedule !== null,
        status: triClubSchedule !== null ? 200 : 404,
        json: () => Promise.resolve(triClubSchedule),
      });
    } else if (url.includes('/api/weekly-targets')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
    } else if (url.includes('/api/weather/by-time-of-day')) {
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
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ weather_code: 0, temperature: 60, rain_probability: 0, windspeed: 5 }),
      });
    } else if (url.includes('/api/selections/')) {
      // Support PUTs to selections endpoint for tests
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
};

describe('App Component', () => {
  beforeEach(() => {
    // Set up mock authentication token
    localStorage.setItem('auth_token', 'test-token-12345');
    localStorage.setItem('user_info', JSON.stringify({ id: 1, username: 'testuser' }));
    
    // Clear all mocks before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders app header', async () => {
    global.fetch = createFetchMock();

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Workout Planner')).toBeInTheDocument();
      expect(screen.getByText('Plan your workouts from TrainingPeaks')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    
    // Initially should show loading state while auth verification is pending
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    // Login should not be rendered while loading
    expect(screen.queryByRole('heading', { name: /login/i })).toBeNull();
  });

  test('auth verify times out and redirects silently to login (clears token)', async () => {
    jest.useFakeTimers();

    // Simulate verify never resolving but listen to AbortSignal so the timeout triggers
    global.fetch = jest.fn((url, opts = {}) => {
      if (url.includes('/api/auth/verify')) {
        return new Promise((resolve, reject) => {
          if (opts && opts.signal) {
            opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('AbortError'), { name: 'AbortError' })));
          }
          // never resolve otherwise
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    localStorage.setItem('auth_token', 'test-token-timeout');

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // Loading is shown initially
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    // Advance time to trigger the 5s timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Wait for the app to clear loading and show Login
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).toBeNull();
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    jest.useRealTimers();
  });

  test('fetches workouts from API on mount', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDescription: 'Easy 5k',
        plannedDuration: 0.5,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: 'Take it easy',
      },
    ];

    global.fetch = createFetchMock(mockWorkouts);

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    await waitFor(() => {
      // Check that fetch was called with the workouts endpoint
      const calls = global.fetch.mock.calls;
      const workoutsCalled = calls.some(call => call[0].includes('/api/workouts'));
      expect(workoutsCalled).toBe(true);
    });
  });

  test('transforms API data correctly with DateOnly object', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Test Workout',
        workoutType: 'Swim',
        workoutDescription: 'Test description',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 2000,
        originallyPlannedDay: '2026-01-15',
        coachComments: 'Test comments',
      },
    ];

    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
    });

    // Verify the workout is passed to Calendar
    await waitFor(() => {
      const calendarCount = screen.getByTestId('calendar-workout-count');
      expect(calendarCount.textContent).toBe('1');
    });
  });

  test('creates DateOnly object from originallyPlannedDay string (bug fix test)', async () => {
    // This test verifies the fix for the bug where workouts weren't showing
    // because workoutDate DateOnly object was missing
    const mockWorkouts = [
      {
        id: 1,
        title: 'Bug Fix Test',
        workoutType: 'Run',
        workoutDescription: 'Testing date transformation',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-20',
        coachComments: '',
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: mockWorkouts, count: 1 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
    });

    // Wait for the Calendar to receive props
    await waitFor(() => {
      expect(mockWorkoutsReceived).toBeDefined();
      expect(mockWorkoutsReceived.length).toBeGreaterThan(0);
    });

    // Verify workoutDate is a DateOnly object
    const workout = mockWorkoutsReceived[0];
    expect(workout).toHaveProperty('workoutDate');
    expect(workout.workoutDate).toBeInstanceOf(DateOnly);
    expect(workout.workoutDate.year).toBe(2026);
    expect(workout.workoutDate.month).toBe(1);
    expect(workout.workoutDate.day).toBe(20);
  });

  test('handles multiple workouts correctly', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDescription: 'Easy 5k',
        plannedDuration: 0.5,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: 'Take it easy',
      },
    ];

    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
    });
  });

  test('sends single PUT when both date and time are updated via combined handler', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDescription: 'Easy 5k',
        plannedDuration: 0.5,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: 'Take it easy',
      },
    ];

    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    // Wait for Calendar mock to receive callbacks
    await waitFor(() => {
      expect(mockCallbacks.onWorkoutSelectionUpdate).toBeDefined();
    });

    // Clear any previous fetch calls so we can observe only the one from the action
    global.fetch.mockClear();

    // Call the combined update handler (simulates drop that changes both date and time)
    await act(async () => {
      await mockCallbacks.onWorkoutSelectionUpdate(1, { currentPlanDay: '2026-01-16', timeOfDay: 'afternoon' });
    });

    // Find calls to selections endpoint
    const selectionCalls = global.fetch.mock.calls.filter(call => call[0] && call[0].includes('/api/selections/1'));
    expect(selectionCalls.length).toBe(1);

    const opts = selectionCalls[0][1];
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body)).toEqual({ currentPlanDay: '2026-01-16', timeOfDay: 'afternoon' });
  });

  // END inserted tests

  test('handles multiple workouts correctly (continued)', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Workout 1',
        workoutType: 'Run',
        originallyPlannedDay: '2026-01-15',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
      },
      {
        id: 2,
        title: 'Workout 2',
        workoutType: 'Bike',
        originallyPlannedDay: '2026-01-16',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
      },
      {
        id: 3,
        title: 'Workout 3',
        workoutType: 'Swim',
        originallyPlannedDay: '2026-01-17',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
      },
    ];

    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 3 workouts')).toBeInTheDocument();
    });

    await waitFor(() => {
      const calendarCount = screen.getByTestId('calendar-workout-count');
      expect(calendarCount.textContent).toBe('3');
    });
  });

  test('displays error message when API call fails', async () => {
    global.fetch = jest.fn((url) => {
      // Auth endpoints should succeed so we get past the login screen
      if (url.includes('/api/auth')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            url.includes('/verify') ? { valid: true, user_id: 1 } : { id: 1, username: 'testuser' }
          ),
        });
      }
      // Other endpoints fail
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to load workouts: 500/)).toBeInTheDocument();
    });

    // Should not show loading anymore
    expect(screen.queryByText('Loading workouts...')).not.toBeInTheDocument();
  });

  test('displays error message when network request fails', async () => {
    // Simulate a fetch failure with smart auth handling
    global.fetch = jest.fn((url) => {
      // Auth endpoints should succeed
      if (url.includes('/api/auth')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            url.includes('/verify') ? { valid: true, user_id: 1 } : { id: 1, username: 'testuser' }
          ),
        });
      }
      // Other endpoints fail with network error
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to backend server/)).toBeInTheDocument();
      expect(screen.getByText(/Make sure the backend is running/)).toBeInTheDocument();
    });
  });

  test('handles empty workout list', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: [], count: 0 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 0 workouts')).toBeInTheDocument();
    });

    await waitFor(() => {
      const calendarCount = screen.getByTestId('calendar-workout-count');
      expect(calendarCount.textContent).toBe('0');
    });
  });

  test('preserves all workout properties from API', async () => {
    const mockWorkout = {
      id: 1,
      title: 'Complete Workout',
      workoutType: 'Run',
      workoutDescription: 'Detailed description',
      plannedDuration: 1.5,
      plannedDistanceInMeters: 10000,
      originallyPlannedDay: '2026-02-01',
      coachComments: 'Important notes',
      tss: 75,
      intensityFactor: 0.85,
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: [mockWorkout], count: 1 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockWorkoutsReceived).toBeDefined();
      expect(mockWorkoutsReceived.length).toBeGreaterThan(0);
    });

    const workout = mockWorkoutsReceived[0];
    expect(workout.title).toBe('Complete Workout');
    expect(workout.workoutType).toBe('Run');
    expect(workout.workoutDescription).toBe('Detailed description');
    expect(workout.plannedDuration).toBe(1.5);
    expect(workout.plannedDistanceInMeters).toBe(10000);
    expect(workout.originallyPlannedDay).toBe('2026-02-01');
    expect(workout.coachComments).toBe('Important notes');
  });

  test('handles workouts with null/undefined optional fields', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Minimal Workout',
        workoutType: 'Other',
        originallyPlannedDay: '2026-01-15',
        workoutDescription: null,
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: null,
        tss: null,
        intensityFactor: null,
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: mockWorkouts, count: 1 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
    });

    // Should not crash with null values
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
  });

  test('transforms workouts with selection data', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Selected Workout',
        workoutType: 'Run',
        workoutDescription: 'Test',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: '',
        selection: {
          id: 1,
          workoutId: 1,
          isSelected: true,
          currentPlanDay: null,
          timeOfDay: null,
          userNotes: null,
        },
      },
      {
        id: 2,
        title: 'Unselected Workout',
        workoutType: 'Swim',
        workoutDescription: 'Test',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 2000,
        originallyPlannedDay: '2026-01-16',
        coachComments: '',
        selection: {
          id: 2,
          workoutId: 2,
          isSelected: false,
          currentPlanDay: null,
          timeOfDay: null,
          userNotes: null,
        },
      },
      {
        id: 3,
        title: 'No Selection',
        workoutType: 'Bike',
        workoutDescription: 'Test',
        plannedDuration: 2.0,
        plannedDistanceInMeters: 40000,
        originallyPlannedDay: '2026-01-17',
        coachComments: '',
        selection: null,
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: mockWorkouts, count: 3 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 3 workouts')).toBeInTheDocument();
    });

    // All workouts should be transformed
    const calendar = screen.getByTestId('mock-calendar');
    expect(calendar).toBeInTheDocument();
    
    // Should have all 3 workouts passed to Calendar
    expect(screen.getByTestId('calendar-workout-count').textContent).toBe('3');
  });

  test('deselecting a workout clears timeOfDay in local state', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Workout with Time',
        workoutType: 'Run',
        workoutDescription: 'Test',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: '',
        selection: {
          id: 1,
          workoutId: 1,
          isSelected: true,
          currentPlanDay: null,
          timeOfDay: 'morning',
          userNotes: null,
        },
      },
    ];

    // Mock fetch for initial load
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: mockWorkouts, count: 1 }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
      expect(mockCallbacks.onWorkoutSelectionToggle).toBeDefined();
    });

    // Mock the fetch for the selection update (deselecting)
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          id: 1,
          workoutId: 1,
          isSelected: false,
          currentPlanDay: null,
          timeOfDay: null,
          userNotes: null
        }),
      })
    );

    // Call the toggle callback to deselect the workout
    await act(async () => {
      await mockCallbacks.onWorkoutSelectionToggle(1, false);
    });

    // Verify the fetch was called with isSelected: false
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/selections/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-12345',
          }),
          body: JSON.stringify({ isSelected: false }),
        })
      );
    });
  });

  test('handles custom workout date change correctly', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Group Ride',
        workoutType: 'Bike',
        workoutDescription: 'Weekly group ride',
        originallyPlannedDay: '2026-01-20',
        plannedDuration: 2.0,
        plannedDistanceInMeters: 50000,
        tss: 120,
        isCustom: true,
        selection: {
          isSelected: true,
          timeOfDay: 'morning',
          workoutLocation: null,
        },
      },
    ];

    // Mock fetch for initial load
    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Loaded 1 workouts/)).toBeInTheDocument();
      expect(mockCallbacks.onWorkoutDateChange).toBeDefined();
    });

    // Mock the fetch for the workout update (using selections endpoint)
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          title: 'Group Ride',
          workoutType: 'Bike',
          description: 'Weekly group ride',
          plannedDate: '2026-01-21',
          plannedDuration: 2.0,
          plannedDistanceInMeters: 50000,
          tss: 120,
          timeOfDay: 'morning',
        }),
      })
    );

    // Call the date change callback
    const newDate = new Date(2026, 0, 21); // January 21, 2026
    await act(async () => {
      await mockCallbacks.onWorkoutDateChange(1, newDate);
    });

    // Verify the fetch was called with the correct endpoint (selections) and data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/selections/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-12345',
          }),
          body: JSON.stringify({ currentPlanDay: '2026-01-21' }),
        })
      );
    });
  });

  test('handles custom workout time of day change correctly', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Group Ride',
        workoutType: 'Bike',
        workoutDescription: 'Weekly group ride',
        originallyPlannedDay: '2026-01-20',
        plannedDuration: 2.0,
        plannedDistanceInMeters: 50000,
        tss: 120,
        isCustom: true,
        selection: {
          isSelected: true,
          timeOfDay: null,
          workoutLocation: null,
        },
      },
    ];

    // Mock fetch for initial load
    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Loaded 1 workouts/)).toBeInTheDocument();
      expect(mockCallbacks.onWorkoutTimeOfDayChange).toBeDefined();
    });

    // Mock the fetch for the workout update (using selections endpoint)
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          workoutId: 1,
          isSelected: true,
          timeOfDay: 'evening',
          workoutLocation: null,
        }),
      })
    );

    // Call the time change callback
    await act(async () => {
      await mockCallbacks.onWorkoutTimeOfDayChange(1, 'evening');
    });

    // Verify the fetch was called with the correct endpoint (selections) and data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/selections/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-12345',
          }),
          body: JSON.stringify({ timeOfDay: 'evening' }),
        })
      );
    });
  });

  test('handles regular workout date change using selections endpoint', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDescription: 'Easy 5k',
        plannedDuration: 0.5,
        plannedDistanceInMeters: 5000,
        originallyPlannedDay: '2026-01-15',
        coachComments: '',
      },
    ];

    // Mock fetch for initial load
    global.fetch = createFetchMock(mockWorkouts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Loaded 1 workouts')).toBeInTheDocument();
      expect(mockCallbacks.onWorkoutDateChange).toBeDefined();
    });

    // Mock the fetch for the selection update
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          workoutId: 1,
          isSelected: true,
          currentPlanDay: '2026-01-16',
          timeOfDay: null,
          userNotes: null,
        }),
      })
    );

    // Call the date change callback for a regular workout
    const newDate = new Date(2026, 0, 16); // January 16, 2026
    await act(async () => {
      await mockCallbacks.onWorkoutDateChange(1, newDate);
    });

    // Verify the fetch was called with the selections endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/selections/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-12345',
          }),
          body: JSON.stringify({ currentPlanDay: '2026-01-16' }),
        })
      );
    });
  });
});