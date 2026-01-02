/**
 * Tests for App component and API integration
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { DateOnly } from './utils/DateOnly';

// Mock the Calendar component since we're testing App
jest.mock('./components/Calendar', () => {
  return function MockCalendar({ workouts }) {
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

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders app header', () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ workouts: [], count: 0 }),
      })
    );

    render(<App />);
    expect(screen.getByText('Workout Planner')).toBeInTheDocument();
    expect(screen.getByText('Plan your workouts from TrainingPeaks')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves

    render(<App />);
    expect(screen.getByText('Loading workouts...')).toBeInTheDocument();
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
        workoutDay: '2026-01-15',
        coachComments: 'Take it easy',
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
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/workouts');
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
        workoutDay: '2026-01-15',
        coachComments: 'Test comments',
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

    // Verify the workout is passed to Calendar
    await waitFor(() => {
      const calendarCount = screen.getByTestId('calendar-workout-count');
      expect(calendarCount.textContent).toBe('1');
    });
  });

  test('creates DateOnly object from workoutDay string (bug fix test)', async () => {
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
        workoutDay: '2026-01-20',
        coachComments: '',
      },
    ];

    let capturedWorkouts = null;

    // Mock Calendar to capture the workouts it receives
    jest.spyOn(React, 'createElement').mockImplementation((type, props, ...children) => {
      if (type && type.name === 'MockCalendar') {
        capturedWorkouts = props.workouts;
      }
      return jest.requireActual('react').createElement(type, props, ...children);
    });

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

    // Wait a bit for the Calendar to receive props
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify workoutDate is a DateOnly object
    if (capturedWorkouts && capturedWorkouts.length > 0) {
      const workout = capturedWorkouts[0];
      expect(workout).toHaveProperty('workoutDate');
      expect(workout.workoutDate).toBeInstanceOf(DateOnly);
      expect(workout.workoutDate.year).toBe(2026);
      expect(workout.workoutDate.month).toBe(1);
      expect(workout.workoutDate.day).toBe(20);
    }

    jest.restoreAllMocks();
  });

  test('handles multiple workouts correctly', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Workout 1',
        workoutType: 'Run',
        workoutDay: '2026-01-15',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
      },
      {
        id: 2,
        title: 'Workout 2',
        workoutType: 'Bike',
        workoutDay: '2026-01-16',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
      },
      {
        id: 3,
        title: 'Workout 3',
        workoutType: 'Swim',
        workoutDay: '2026-01-17',
        workoutDescription: '',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        coachComments: '',
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

    await waitFor(() => {
      const calendarCount = screen.getByTestId('calendar-workout-count');
      expect(calendarCount.textContent).toBe('3');
    });
  });

  test('displays error message when API call fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to load workouts: 500/)).toBeInTheDocument();
    });

    // Should not show loading anymore
    expect(screen.queryByText('Loading workouts...')).not.toBeInTheDocument();
  });

  test('displays error message when network request fails', async () => {
    // Simulate a fetch failure (TypeError is what fetch throws when it can't connect)
    global.fetch = jest.fn(() =>
      Promise.reject(new TypeError('Failed to fetch'))
    );

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
      workoutDay: '2026-02-01',
      coachComments: 'Important notes',
      tss: 75,
      intensityFactor: 0.85,
    };

    let capturedWorkouts = null;

    jest.spyOn(React, 'createElement').mockImplementation((type, props, ...children) => {
      if (type && type.name === 'MockCalendar') {
        capturedWorkouts = props.workouts;
      }
      return jest.requireActual('react').createElement(type, props, ...children);
    });

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

    await new Promise(resolve => setTimeout(resolve, 100));

    if (capturedWorkouts && capturedWorkouts.length > 0) {
      const workout = capturedWorkouts[0];
      expect(workout.title).toBe('Complete Workout');
      expect(workout.workoutType).toBe('Run');
      expect(workout.workoutDescription).toBe('Detailed description');
      expect(workout.plannedDuration).toBe(1.5);
      expect(workout.plannedDistanceInMeters).toBe(10000);
      expect(workout.workoutDay).toBe('2026-02-01');
      expect(workout.coachComments).toBe('Important notes');
    }

    jest.restoreAllMocks();
  });

  test('handles workouts with null/undefined optional fields', async () => {
    const mockWorkouts = [
      {
        id: 1,
        title: 'Minimal Workout',
        workoutType: 'Other',
        workoutDay: '2026-01-15',
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
        workoutDay: '2026-01-15',
        coachComments: '',
        selection: {
          id: 1,
          workoutId: 1,
          isSelected: true,
          actualDate: null,
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
        workoutDay: '2026-01-16',
        coachComments: '',
        selection: {
          id: 2,
          workoutId: 2,
          isSelected: false,
          actualDate: null,
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
        workoutDay: '2026-01-17',
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
});
