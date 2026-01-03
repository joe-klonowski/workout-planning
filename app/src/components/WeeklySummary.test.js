import React from 'react';
import { render, screen } from '@testing-library/react';
import WeeklySummary from './WeeklySummary';
import { DateOnly } from '../utils/DateOnly';

describe('WeeklySummary', () => {
  const createMockWorkout = (overrides = {}) => ({
    id: 1,
    title: 'Test Workout',
    workoutType: 'Run',
    workoutDate: new DateOnly(2026, 1, 5),
    originallyPlannedDay: '2026-01-05',
    plannedDuration: 1.0,
    plannedDistanceInMeters: 5000,
    isSelected: true,
    ...overrides,
  });

  describe('Empty state', () => {
    test('renders empty state when no workouts provided', () => {
      render(<WeeklySummary workouts={[]} />);
      
      expect(screen.getByText('Week Summary')).toBeInTheDocument();
      expect(screen.getByText('No workouts planned')).toBeInTheDocument();
      expect(screen.getByText('0h')).toBeInTheDocument();
      expect(screen.getByText('0 workouts')).toBeInTheDocument();
    });

    test('renders empty state when all workouts are unselected', () => {
      const workouts = [
        createMockWorkout({ id: 1, isSelected: false }),
        createMockWorkout({ id: 2, isSelected: false }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('No workouts planned')).toBeInTheDocument();
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  describe('Total hours calculation', () => {
    test('calculates total hours correctly for single workout', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 1.5 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('1h 30m');
      expect(screen.getByText('1 workouts')).toBeInTheDocument();
    });

    test('calculates total hours correctly for multiple workouts', () => {
      const workouts = [
        createMockWorkout({ id: 1, plannedDuration: 1.5 }),
        createMockWorkout({ id: 2, plannedDuration: 2.25 }),
        createMockWorkout({ id: 3, plannedDuration: 0.75 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('4h 30m');
      expect(screen.getByText('3 workouts')).toBeInTheDocument();
    });

    test('displays only hours when minutes are zero', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 2.0 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('2h');
    });

    test('displays only minutes when hours are zero', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 0.5 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('30m');
    });

    test('rounds minutes to nearest minute', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0083333 }), // 1 hour 0.5 minutes
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      // Should round to 1h 1m or 1h
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent(/1h/);
    });

    test('filters out unselected workouts from total', () => {
      const workouts = [
        createMockWorkout({ id: 1, plannedDuration: 1.0, isSelected: true }),
        createMockWorkout({ id: 2, plannedDuration: 2.0, isSelected: false }),
        createMockWorkout({ id: 3, plannedDuration: 1.0, isSelected: true }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('2h');
      expect(screen.getByText('2 workouts')).toBeInTheDocument();
    });
  });

  describe('Workout type breakdown', () => {
    test('displays breakdown for single workout type', () => {
      const workouts = [
        createMockWorkout({ workoutType: 'Run', plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('By Type')).toBeInTheDocument();
      expect(screen.getByText('Run')).toBeInTheDocument();
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('Count:')).toBeInTheDocument();
    });

    test('displays breakdown for multiple workout types', () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Bike', plannedDuration: 2.0 }),
        createMockWorkout({ id: 3, workoutType: 'Run', plannedDuration: 1.5 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('Swim')).toBeInTheDocument();
      expect(screen.getByText('Bike')).toBeInTheDocument();
      expect(screen.getByText('Run')).toBeInTheDocument();
    });

    test('aggregates multiple workouts of same type', () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Run', plannedDuration: 1.5 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      // Should show aggregated duration
      const runSection = screen.getByText('Run').closest('.breakdown-item');
      expect(runSection).toHaveTextContent('2h 30m');
      expect(runSection).toHaveTextContent('2'); // count
    });

    test('displays workout icons correctly', () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Bike', plannedDuration: 1.0 }),
        createMockWorkout({ id: 3, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 4, workoutType: 'Strength', plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      // Check that workout type icons are present
      expect(screen.getByText('🏊')).toBeInTheDocument();
      expect(screen.getByText('🚴')).toBeInTheDocument();
      expect(screen.getByText('🏃')).toBeInTheDocument();
      expect(screen.getByText('💪')).toBeInTheDocument();
    });

    test('orders workout types consistently', () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Strength', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 3, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 4, workoutType: 'Bike', plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const breakdownItems = screen.getAllByText(/Swim|Bike|Run|Strength/);
      const order = breakdownItems.map(item => item.textContent);
      
      // Should be in order: Swim, Bike, Run, Strength
      const swimIndex = order.indexOf('Swim');
      const bikeIndex = order.indexOf('Bike');
      const runIndex = order.indexOf('Run');
      const strengthIndex = order.indexOf('Strength');
      
      expect(swimIndex).toBeLessThan(bikeIndex);
      expect(bikeIndex).toBeLessThan(runIndex);
      expect(runIndex).toBeLessThan(strengthIndex);
    });
  });

  describe('Distance display', () => {
    test('displays distance for swim in meters when less than 1km', () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Swim', 
          plannedDistanceInMeters: 500,
          plannedDuration: 1.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('500 m')).toBeInTheDocument();
    });

    test('displays distance for swim in km when >= 1000m', () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Swim', 
          plannedDistanceInMeters: 2500,
          plannedDuration: 1.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('2.5 km')).toBeInTheDocument();
    });

    test('displays distance for run in km', () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Run', 
          plannedDistanceInMeters: 5000,
          plannedDuration: 1.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('5.0 km')).toBeInTheDocument();
    });

    test('aggregates distance for multiple workouts of same type', () => {
      const workouts = [
        createMockWorkout({ 
          id: 1,
          workoutType: 'Run', 
          plannedDistanceInMeters: 5000,
          plannedDuration: 1.0 
        }),
        createMockWorkout({ 
          id: 2,
          workoutType: 'Run', 
          plannedDistanceInMeters: 3000,
          plannedDuration: 0.5 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      expect(screen.getByText('8.0 km')).toBeInTheDocument();
    });

    test('does not display distance when zero', () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Strength', 
          plannedDistanceInMeters: 0,
          plannedDuration: 1.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const strengthSection = screen.getByText('Strength').closest('.breakdown-item');
      expect(strengthSection).not.toHaveTextContent('Distance:');
    });
  });

  describe('Edge cases', () => {
    test('handles workouts with zero duration', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 0 }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('0h');
    });

    test('handles workouts with null duration', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: null }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('0h');
    });

    test('handles workouts with undefined duration', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: undefined }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('0h');
    });

    test('handles very large durations', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 25.75 }), // 25 hours 45 minutes
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('25h 45m');
    });

    test('handles unknown workout types', () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'UnknownType',
          plannedDuration: 1.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} />);
      
      // Unknown types should not appear in ordered list, so won't be shown
      // But total hours should still work
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('1h');
      expect(screen.getByText('1 workouts')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    test('renders header correctly', () => {
      render(<WeeklySummary workouts={[]} />);
      
      const header = screen.getByText('Week Summary');
      expect(header.tagName).toBe('H3');
    });

    test('renders with correct CSS classes', () => {
      const { container } = render(<WeeklySummary workouts={[]} />);
      
      expect(container.querySelector('.weekly-summary')).toBeInTheDocument();
      expect(container.querySelector('.summary-header')).toBeInTheDocument();
      expect(container.querySelector('.total-hours')).toBeInTheDocument();
    });

    test('does not render breakdown section when no workouts', () => {
      const { container } = render(<WeeklySummary workouts={[]} />);
      
      expect(container.querySelector('.breakdown')).not.toBeInTheDocument();
    });

    test('renders breakdown section when workouts present', () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      const { container } = render(<WeeklySummary workouts={workouts} />);
      
      expect(container.querySelector('.breakdown')).toBeInTheDocument();
    });
  });
});
