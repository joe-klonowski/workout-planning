import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import WeeklySummary from './WeeklySummary';
import { DateOnly } from '../utils/DateOnly';

// Mock fetch
global.fetch = jest.fn();

describe('WeeklySummary', () => {
  // Mock weekly targets now returned as an array with one entry per week
  const mockWeeklyTargets = [
    {
      week_start_date: '2026-01-05',
      weekly_targets: {
        tss: 460,
        total_time: {
          hours: 11,
          minutes: 33
        },
        by_discipline: {
          swim: { hours: 1, minutes: 48 },
          bike: { hours: 4, minutes: 30 },
          run: { hours: 3, minutes: 15 },
          strength: { hours: 2, minutes: 0 }
        }
      }
    }
  ];

  beforeEach(() => {
    // Reset mock before each test
    fetch.mockClear();
    // Default mock: successful fetch of weekly targets
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockWeeklyTargets,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
    test('renders empty state when no workouts provided', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={[]} weekStartDate={weekStartDate} />);
      
      // Wait for async effects to complete
      await waitFor(() => {
        expect(screen.getByText('Week Summary')).toBeInTheDocument();
      });
      
      expect(screen.getByText('No workouts planned')).toBeInTheDocument();
      expect(screen.getByText('0h')).toBeInTheDocument();
      expect(screen.getByText('0 workouts')).toBeInTheDocument();
    });

    test('renders empty state when all workouts are unselected', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ id: 1, isSelected: false }),
        createMockWorkout({ id: 2, isSelected: false }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      // Wait for async effects to complete
      await waitFor(() => {
        expect(screen.getByText('No workouts planned')).toBeInTheDocument();
      });
      
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  describe('Total hours calculation', () => {
    test('calculates total hours correctly for single workout', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ plannedDuration: 1.5 }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('1h 30m');
      });
      
      expect(screen.getByText('1 workouts')).toBeInTheDocument();
    });

    test('calculates total hours correctly for multiple workouts', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ id: 1, plannedDuration: 1.5 }),
        createMockWorkout({ id: 2, plannedDuration: 2.25 }),
        createMockWorkout({ id: 3, plannedDuration: 0.75 }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('4h 30m');
      });
      
      expect(screen.getByText('3 workouts')).toBeInTheDocument();
    });

    test('displays only hours when minutes are zero', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 2.0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('2h');
      });
    });

    test('displays only minutes when hours are zero', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 0.5 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('30m');
      });
    });

    test('rounds minutes to nearest minute', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0083333 }), // 1 hour 0.5 minutes
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      // Should round to 1h 1m or 1h
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent(/1h/);
      });
    });

    test('filters out unselected workouts from total', async () => {
      const workouts = [
        createMockWorkout({ id: 1, plannedDuration: 1.0, isSelected: true }),
        createMockWorkout({ id: 2, plannedDuration: 2.0, isSelected: false }),
        createMockWorkout({ id: 3, plannedDuration: 1.0, isSelected: true }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('2h');
      });
      
      expect(screen.getByText('2 workouts')).toBeInTheDocument();
    });
  });

  describe('Workout type breakdown', () => {
    test('displays breakdown for single workout type', async () => {
      const workouts = [
        createMockWorkout({ workoutType: 'Run', plannedDuration: 1.0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('By Type')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Run')).toBeInTheDocument();
      expect(screen.getByText('Planned duration:')).toBeInTheDocument();
      expect(screen.getByText('Count:')).toBeInTheDocument();
    });

    test('displays breakdown for multiple workout types', async () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Bike', plannedDuration: 2.0 }),
        createMockWorkout({ id: 3, workoutType: 'Run', plannedDuration: 1.5 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Swim')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Bike')).toBeInTheDocument();
      expect(screen.getByText('Run')).toBeInTheDocument();
    });

    test('aggregates multiple workouts of same type', async () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Run', plannedDuration: 1.5 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      // Should show aggregated duration
      await waitFor(() => {
        const runSection = screen.getByText('Run').closest('.breakdown-item');
        expect(runSection).toHaveTextContent('2h 30m');
        expect(runSection).toHaveTextContent('2'); // count
      });
    });

    test('displays workout icons correctly', async () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Bike', plannedDuration: 1.0 }),
        createMockWorkout({ id: 3, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 4, workoutType: 'Strength', plannedDuration: 1.0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      // Check that workout type icons are present
      await waitFor(() => {
        expect(screen.getByText('🏊')).toBeInTheDocument();
      });
      
      expect(screen.getByText('🚴')).toBeInTheDocument();
      expect(screen.getByText('🏃')).toBeInTheDocument();
      expect(screen.getByText('💪')).toBeInTheDocument();
    });

    test('orders workout types consistently', async () => {
      const workouts = [
        createMockWorkout({ id: 1, workoutType: 'Strength', plannedDuration: 1.0 }),
        createMockWorkout({ id: 2, workoutType: 'Run', plannedDuration: 1.0 }),
        createMockWorkout({ id: 3, workoutType: 'Swim', plannedDuration: 1.0 }),
        createMockWorkout({ id: 4, workoutType: 'Bike', plannedDuration: 1.0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
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
  });

  describe('Distance display', () => {
    test('displays distance for swim in meters when less than 1km', async () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Swim', 
          plannedDistanceInMeters: 500,
          plannedDuration: 1.0 
        }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('500 m')).toBeInTheDocument();
      });
    });

    test('displays distance for swim in km when >= 1000m', async () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Swim', 
          plannedDistanceInMeters: 2500,
          plannedDuration: 1.0 
        }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('2.5 km')).toBeInTheDocument();
      });
    });

    test('displays distance for run in km', async () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Run', 
          plannedDistanceInMeters: 5000,
          plannedDuration: 1.0 
        }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('5.0 km')).toBeInTheDocument();
      });
    });

    test('aggregates distance for multiple workouts of same type', async () => {
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

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(screen.getByText('8.0 km')).toBeInTheDocument();
      });
    });

    test('does not display distance when zero', async () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'Strength', 
          plannedDistanceInMeters: 0,
          plannedDuration: 1.0 
        }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const strengthSection = screen.getByText('Strength').closest('.breakdown-item');
        expect(strengthSection).not.toHaveTextContent('Distance:');
      });
    });
  });

  describe('Edge cases', () => {
    test('handles workouts with zero duration', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('0h');
      });
    });

    test('handles workouts with null duration', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: null }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('0h');
      });
    });

    test('handles workouts with undefined duration', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: undefined }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('0h');
      });
    });

    test('handles very large durations', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 25.75 }), // 25 hours 45 minutes
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('25h 45m');
      });
    });

    test('handles unknown workout types', async () => {
      const workouts = [
        createMockWorkout({ 
          workoutType: 'UnknownType',
          plannedDuration: 1.0 
        }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      // Unknown types should not appear in ordered list, so won't be shown
      // But total hours should still work
      await waitFor(() => {
        const totalSection = screen.getByText('Total Hours').parentElement;
        expect(totalSection).toHaveTextContent('1h');
      });
      
      expect(screen.getByText('1 workouts')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    test('renders header correctly', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      render(<WeeklySummary workouts={[]} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        const header = screen.getByText('Week Summary');
        expect(header.tagName).toBe('H3');
      });
    });

    test('renders with correct CSS classes', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const { container } = render(<WeeklySummary workouts={[]} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(container.querySelector('.weekly-summary')).toBeInTheDocument();
      });
      
      expect(container.querySelector('.summary-header')).toBeInTheDocument();
      expect(container.querySelector('.total-hours')).toBeInTheDocument();
    });

    test('does not render breakdown section when no workouts', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const { container } = render(<WeeklySummary workouts={[]} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(container.querySelector('.weekly-summary')).toBeInTheDocument();
      });
      
      expect(container.querySelector('.breakdown')).not.toBeInTheDocument();
    });

    test('renders breakdown section when workouts present', async () => {
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      const weekStartDate = new DateOnly(2026, 1, 5);
      const { container } = render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);
      
      await waitFor(() => {
        expect(container.querySelector('.breakdown')).toBeInTheDocument();
      });
    });
  });

  describe('Weekly targets', () => {
    test('fetches and displays weekly targets', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      // Wait for the fetch to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/weekly-targets'));
      });

      // Check that the target is displayed
      await waitFor(() => {
        expect(screen.getByText(/Target: 11h 33m/)).toBeInTheDocument();
      });
    });

    test('displays TSS section with Completed < Projected and Friel Target when available', async () => {
      // Freeze system time to a date within the week so calculations are deterministic
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(2026, 0, 7)); // 2026-01-07

      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        // Completed workout on Jan 5
        createMockWorkout({ 
          plannedDuration: 1.0,
          tss: 50
        }),
        // Planned future workout on Jan 9 with TSS 30 (should be included in projected but not completed)
        createMockWorkout({
          id: 2,
          plannedDuration: 1.5,
          tss: 30,
          isSelected: true,
          workoutDate: new DateOnly(2026, 1, 9)
        }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      // Wait for the TSS section to appear
      await waitFor(() => {
        expect(screen.getByText(/TSS \(Training Stress Score\)/)).toBeInTheDocument();
      });

      // All three TSS numbers/labels should be present and show correct values
      await waitFor(() => {
        const completedDetail = screen.getByText(/Completed:/).closest('.summary-detail');
        const projectedDetail = screen.getByText(/Projected:/).closest('.summary-detail');
        expect(within(completedDetail).getByText('50')).toBeInTheDocument();
        expect(within(projectedDetail).getByText('80')).toBeInTheDocument();
        expect(screen.getByText(/Friel Target: 460/)).toBeInTheDocument();
      });

      // Restore timers
      jest.useRealTimers();
    });

    test('displays discipline-specific targets', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ 
          id: 1,
          workoutType: 'Swim',
          plannedDuration: 1.0 
        }),
        createMockWorkout({ 
          id: 2,
          workoutType: 'Bike',
          plannedDuration: 2.0 
        }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      await waitFor(() => {
        const swimSection = screen.getByText('Swim').closest('.breakdown-item');
        expect(swimSection).toHaveTextContent('Friel target duration:');
        expect(swimSection).toHaveTextContent('1h 48m');
      });

      await waitFor(() => {
        const bikeSection = screen.getByText('Bike').closest('.breakdown-item');
        expect(bikeSection).toHaveTextContent('Friel target duration:');
        expect(bikeSection).toHaveTextContent('4h 30m');
      });
    });

    test('handles fetch error gracefully', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      // Mock fetch to return an error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      // Suppress expected console.error for network failure
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw an error
      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      // Component should still render without targets
      expect(screen.getByText('Week Summary')).toBeInTheDocument();
      const totalSection = screen.getByText('Total Hours').parentElement;
      expect(totalSection).toHaveTextContent('1h');
      
      // Wait a bit to ensure fetch was called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles API response error gracefully', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      // Mock fetch to return a failed response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      // Suppress expected console.error for API response failure
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      // Component should still render without targets
      expect(screen.getByText('Week Summary')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    test('does not display targets when API returns empty array', async () => {
      const weekStartDate = new DateOnly(2026, 1, 5);
      // Mock fetch to return empty array (no matching week)
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Should not display target line
      expect(screen.queryByText(/Target:/)).not.toBeInTheDocument();
    });

    test('does not display targets when week does not match', async () => {
      const weekStartDate = new DateOnly(2026, 2, 9); // Different week not in mock data
      const workouts = [
        createMockWorkout({ plannedDuration: 1.0 }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Should not display target line since week doesn't match
      expect(screen.queryByText(/Friel Target:/)).not.toBeInTheDocument();
    });

    test('displays completed and projected TSS correctly (excluding Strength workouts)', async () => {
      // Freeze system time to a date within the week for deterministic behavior
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(2026, 0, 7)); // 2026-01-07

      const weekStartDate = new DateOnly(2026, 1, 5);
      const workouts = [
        createMockWorkout({ 
          id: 1,
          plannedDuration: 1.0,
          tss: 50
        }),
        createMockWorkout({ 
          id: 2,
          plannedDuration: 2.0,
          tss: 75
        }),
        createMockWorkout({ 
          id: 3,
          plannedDuration: 0.5,
          tss: 40,
          workoutType: 'Strength'
        }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      await waitFor(() => {
        // Completed TSS should be sum of non-strength workouts (50 + 75 = 125)
        const completedDetail = screen.getByText(/Completed:/).closest('.summary-detail');
        const projectedDetail = screen.getByText(/Projected:/).closest('.summary-detail');
        expect(within(completedDetail).getByText('125')).toBeInTheDocument();
        expect(within(projectedDetail).getByText('125')).toBeInTheDocument();
      });

      // Restore timers
      jest.useRealTimers();
    });

    test('projected TSS excludes deselected workouts', async () => {
      // Freeze system time to a date early in the week so workouts later in the week are 'planned'
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(2026, 0, 6)); // 2026-01-06

      const weekStartDate = new DateOnly(2026, 1, 5);
      // Two future workouts on 2026-01-09 (within same week). One is selected, one is deselected.
      const futureDate = new DateOnly(2026, 1, 9);
      const workouts = [
        createMockWorkout({ id: 1, tss: 50, isSelected: true, workoutDate: futureDate }),
        createMockWorkout({ id: 2, tss: 80, isSelected: false, workoutDate: futureDate }),
      ];

      render(<WeeklySummary workouts={workouts} weekStartDate={weekStartDate} />);

      await waitFor(() => {
        // Completed should be 0 (no completed workouts yet) and projected should include only selected workout (50)
        const completedDetail = screen.getByText(/Completed:/).closest('.summary-detail');
        const projectedDetail = screen.getByText(/Projected:/).closest('.summary-detail');
        expect(within(completedDetail).getByText('0')).toBeInTheDocument();
        expect(within(projectedDetail).getByText('50')).toBeInTheDocument();
      });

      // Restore timers
      jest.useRealTimers();
    });
  });
});
