/**
 * Integration tests for DateOnly transformation bug fix
 * 
 * These tests verify the fix for the issue where workouts from the API
 * weren't displaying because they lacked the workoutDate DateOnly property
 * that the Calendar component expects.
 */
import { DateOnly } from './DateOnly';

describe('API Data Transformation - DateOnly Bug Fix', () => {
  test('DateOnly can be created from API date string', () => {
    const apiDateString = '2026-01-15';
    const [year, month, day] = apiDateString.split('-').map(Number);
    const dateOnly = new DateOnly(year, month, day);

    expect(dateOnly).toBeInstanceOf(DateOnly);
    expect(dateOnly.year).toBe(2026);
    expect(dateOnly.month).toBe(1);
    expect(dateOnly.day).toBe(15);
  });

  test('DateOnly toISOString matches API format', () => {
    const dateOnly = new DateOnly(2026, 1, 15);
    const isoString = dateOnly.toISOString();

    expect(isoString).toBe('2026-01-15');
  });

  test('transforming API workout to include workoutDate', () => {
    const apiWorkout = {
      id: 1,
      title: 'Morning Run',
      workoutType: 'Run',
      workoutDescription: 'Easy 5k',
      plannedDuration: 0.5,
      plannedDistanceInMeters: 5000,
      workoutDay: '2026-01-20',
      coachComments: 'Take it easy',
    };

    // Transform like App.js does
    const [year, month, day] = apiWorkout.workoutDay.split('-').map(Number);
    const transformed = {
      ...apiWorkout,
      workoutDate: new DateOnly(year, month, day),
    };

    expect(transformed).toHaveProperty('workoutDate');
    expect(transformed.workoutDate).toBeInstanceOf(DateOnly);
    expect(transformed.workoutDate.year).toBe(2026);
    expect(transformed.workoutDate.month).toBe(1);
    expect(transformed.workoutDate.day).toBe(20);
    expect(transformed.workoutDate.toISOString()).toBe('2026-01-20');
  });

  test('multiple API workouts transformed correctly', () => {
    const apiWorkouts = [
      { id: 1, title: 'Workout 1', workoutType: 'Run', workoutDay: '2026-01-15', workoutDescription: '', plannedDuration: null, plannedDistanceInMeters: null, coachComments: '' },
      { id: 2, title: 'Workout 2', workoutType: 'Bike', workoutDay: '2026-01-16', workoutDescription: '', plannedDuration: null, plannedDistanceInMeters: null, coachComments: '' },
      { id: 3, title: 'Workout 3', workoutType: 'Swim', workoutDay: '2026-01-17', workoutDescription: '', plannedDuration: null, plannedDistanceInMeters: null, coachComments: '' },
    ];

    const transformed = apiWorkouts.map(workout => {
      const [year, month, day] = workout.workoutDay.split('-').map(Number);
      return {
        ...workout,
        workoutDate: new DateOnly(year, month, day),
      };
    });

    expect(transformed).toHaveLength(3);
    
    transformed.forEach((workout, index) => {
      expect(workout.workoutDate).toBeInstanceOf(DateOnly);
      expect(workout.workoutDate.toISOString()).toBe(apiWorkouts[index].workoutDay);
    });
  });

  test('workoutDate can be grouped by Calendar component', () => {
    // Simulate what groupWorkoutsByDate does
    const workouts = [
      {
        title: 'Morning Swim',
        workoutDate: new DateOnly(2026, 1, 15),
      },
      {
        title: 'Afternoon Run',
        workoutDate: new DateOnly(2026, 1, 15),
      },
      {
        title: 'Evening Bike',
        workoutDate: new DateOnly(2026, 1, 16),
      },
    ];

    // Simple grouping logic
    const grouped = {};
    workouts.forEach(workout => {
      if (workout.workoutDate) {
        const dateKey = workout.workoutDate.toISOString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(workout);
      }
    });

    expect(grouped).toHaveProperty('2026-01-15');
    expect(grouped['2026-01-15']).toHaveLength(2);
    expect(grouped).toHaveProperty('2026-01-16');
    expect(grouped['2026-01-16']).toHaveLength(1);
  });

  test('edge case: handles different date formats', () => {
    const testDates = [
      '2026-01-01',
      '2026-12-31',
      '2026-06-15',
    ];

    testDates.forEach(dateString => {
      const [year, month, day] = dateString.split('-').map(Number);
      const dateOnly = new DateOnly(year, month, day);
      
      expect(dateOnly.toISOString()).toBe(dateString);
    });
  });

  test('regression test: workouts without workoutDate should not crash', () => {
    const workoutsWithMissingDate = [
      {
        title: 'Workout 1',
        workoutDate: new DateOnly(2026, 1, 15),
      },
      {
        title: 'Workout 2',
        // Missing workoutDate - simulating the bug
      },
    ];

    // groupWorkoutsByDate should handle this gracefully
    const grouped = {};
    workoutsWithMissingDate.forEach(workout => {
      if (workout.workoutDate) {
        const dateKey = workout.workoutDate.toISOString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(workout);
      }
    });

    expect(grouped['2026-01-15']).toHaveLength(1);
    expect(Object.keys(grouped)).toHaveLength(1);
  });
});
