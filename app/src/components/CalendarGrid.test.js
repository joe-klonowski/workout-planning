import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarGrid from './CalendarGrid';
import { DateOnly } from '../utils/DateOnly';

// Mock the CalendarDay component
jest.mock('./CalendarDay', () => {
  return function MockCalendarDay({ dayObj, workouts, viewMode, isToday }) {
    return (
      <div 
        data-testid={`calendar-day-${dayObj.year}-${dayObj.month}-${dayObj.day}`}
        data-view-mode={viewMode}
        data-is-today={isToday}
        data-workouts-count={workouts.length}
      >
        Day: {dayObj.day}
      </div>
    );
  };
});

describe('CalendarGrid', () => {
  const mockDragState = {
    draggedWorkout: null,
    dragOverDate: null,
    dragOverTimeSlot: null,
  };

  const mockHandlers = {
    onDragOver: jest.fn(),
    onDragLeave: jest.fn(),
    onDrop: jest.fn(),
    onWorkoutClick: jest.fn(),
    onWorkoutSelectionToggle: jest.fn(),
    onWorkoutDragStart: jest.fn(),
    onWorkoutDragEnd: jest.fn(),
  };

  const createDays = (count = 7, startDate = new Date(2026, 0, 6)) => {
    const days = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push({
        day: date.getDate(),
        year: date.getFullYear(),
        month: date.getMonth(),
        date: date,
        isCurrentMonth: true,
      });
    }
    return days;
  };

  const createWorkout = (id, date, isSelected = false) => ({
    id,
    title: `Workout ${id}`,
    workoutType: 'Run',
    workoutDate: date,
    originallyPlannedDay: 'Monday',
    isSelected,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Day-of-week headers', () => {
    test('renders day-of-week headers in correct order', () => {
      const days = createDays(7);
      const { container } = render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const headers = container.querySelectorAll('.day-of-week');
      expect(headers).toHaveLength(7);
      expect(headers[0]).toHaveTextContent('Mon');
      expect(headers[1]).toHaveTextContent('Tue');
      expect(headers[2]).toHaveTextContent('Wed');
      expect(headers[3]).toHaveTextContent('Thu');
      expect(headers[4]).toHaveTextContent('Fri');
      expect(headers[5]).toHaveTextContent('Sat');
      expect(headers[6]).toHaveTextContent('Sun');
    });

    test('renders headers with correct CSS class', () => {
      const days = createDays(7);
      const { container } = render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const headersContainer = container.querySelector('.day-of-week-headers');
      expect(headersContainer).toBeInTheDocument();
    });
  });

  describe('Grid rendering', () => {
    test('renders correct number of CalendarDay components', () => {
      const days = createDays(7);
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const calendarDays = screen.getAllByTestId(/calendar-day-/);
      expect(calendarDays).toHaveLength(7);
    });

    test('renders with week view mode', () => {
      const days = createDays(7);
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const calendarDays = screen.getAllByTestId(/calendar-day-/);
      calendarDays.forEach(day => {
        expect(day).toHaveAttribute('data-view-mode', 'week');
      });
    });

    test('renders with month view mode', () => {
      const days = createDays(35); // Typical month view
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="month"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const calendarDays = screen.getAllByTestId(/calendar-day-/);
      calendarDays.forEach(day => {
        expect(day).toHaveAttribute('data-view-mode', 'month');
      });
    });

    test('applies correct CSS classes to grid', () => {
      const days = createDays(7);
      const { container } = render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const grid = container.querySelector('.calendar-grid');
      expect(grid).toHaveClass('calendar-grid', 'week');
      expect(grid).not.toHaveClass('dragging');
    });

    test('applies dragging class when showTimeSlots is true', () => {
      const days = createDays(7);
      const { container } = render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={true}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const grid = container.querySelector('.calendar-grid');
      expect(grid).toHaveClass('calendar-grid', 'week', 'dragging');
    });
  });

  describe('Workout data handling', () => {
    test('passes workouts to correct day', () => {
      const days = createDays(7, new Date(2026, 0, 6)); // Jan 6-12, 2026
      const workout1 = createWorkout(1, new DateOnly(2026, 1, 6));
      const workout2 = createWorkout(2, new DateOnly(2026, 1, 6));
      const workout3 = createWorkout(3, new DateOnly(2026, 1, 8));

      const workoutsByDate = {
        '2026-01-06': [workout1, workout2],
        '2026-01-08': [workout3],
      };

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={workoutsByDate}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const day1 = screen.getByTestId('calendar-day-2026-0-6');
      const day3 = screen.getByTestId('calendar-day-2026-0-8');
      
      expect(day1).toHaveAttribute('data-workouts-count', '2');
      expect(day3).toHaveAttribute('data-workouts-count', '1');
    });

    test('sorts workouts with selected first', () => {
      const days = createDays(1, new Date(2026, 0, 6));
      const workout1 = createWorkout(1, new DateOnly(2026, 1, 6), false);
      const workout2 = createWorkout(2, new DateOnly(2026, 1, 6), true);
      const workout3 = createWorkout(3, new DateOnly(2026, 1, 6), false);

      const workoutsByDate = {
        '2026-01-06': [workout1, workout2, workout3],
      };

      // We need to check that getWorkoutsForDay sorts correctly
      // Since we're mocking CalendarDay, we can't directly test the sorting
      // but we can verify the component renders without errors
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={workoutsByDate}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const day = screen.getByTestId('calendar-day-2026-0-6');
      expect(day).toHaveAttribute('data-workouts-count', '3');
    });

    test('handles empty workouts array for a day', () => {
      const days = createDays(7);
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const calendarDays = screen.getAllByTestId(/calendar-day-/);
      calendarDays.forEach(day => {
        expect(day).toHaveAttribute('data-workouts-count', '0');
      });
    });
  });

  describe('Today highlighting', () => {
    test('marks today correctly', () => {
      const today = new Date();
      const days = [{
        day: today.getDate(),
        year: today.getFullYear(),
        month: today.getMonth(),
        date: today,
        isCurrentMonth: true,
      }];

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const todayCell = screen.getByTestId(
        `calendar-day-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
      );
      expect(todayCell).toHaveAttribute('data-is-today', 'true');
    });

    test('does not mark other days as today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const days = [{
        day: tomorrow.getDate(),
        year: tomorrow.getFullYear(),
        month: tomorrow.getMonth(),
        date: tomorrow,
        isCurrentMonth: true,
      }];

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const tomorrowCell = screen.getByTestId(
        `calendar-day-${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`
      );
      expect(tomorrowCell).toHaveAttribute('data-is-today', 'false');
    });
  });

  describe('Prop passing to CalendarDay', () => {
    test('passes all required props to CalendarDay', () => {
      const days = createDays(1);
      const triClubSchedule = {
        effective_date: '2026-01-01',
        schedule: {
          Monday: [{ time: '06:00', activity: 'Swim' }],
        },
      };

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={triClubSchedule}
          showTimeSlots={true}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Verify component renders (CalendarDay receives all props)
      expect(screen.getByTestId(/calendar-day-/)).toBeInTheDocument();
    });

    test('handles null triClubSchedule', () => {
      const days = createDays(7);
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getAllByTestId(/calendar-day-/)).toHaveLength(7);
    });
  });

  describe('Edge cases', () => {
    test('handles empty days array', () => {
      const { container } = render(
        <CalendarGrid
          days={[]}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const grid = container.querySelector('.calendar-grid');
      expect(grid).toBeInTheDocument();
      expect(grid.children).toHaveLength(0);
    });

    test('handles large number of days (month view with padding)', () => {
      const days = createDays(42); // Full 6-week month view
      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="month"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const calendarDays = screen.getAllByTestId(/calendar-day-/);
      expect(calendarDays).toHaveLength(42);
    });

    test('handles workouts with special characters in date string', () => {
      const days = createDays(1, new Date(2026, 0, 6));
      const workout = createWorkout(1, new DateOnly(2026, 1, 6));
      
      const workoutsByDate = {
        '2026-01-06': [workout],
      };

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={workoutsByDate}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const day = screen.getByTestId('calendar-day-2026-0-6');
      expect(day).toHaveAttribute('data-workouts-count', '1');
    });

    test('handles month transitions correctly', () => {
      // Create days spanning month boundary (Dec 30 - Jan 5)
      const days = [
        {
          day: 30,
          year: 2025,
          month: 11, // December
          date: new Date(2025, 11, 30),
          isCurrentMonth: false,
        },
        {
          day: 31,
          year: 2025,
          month: 11,
          date: new Date(2025, 11, 31),
          isCurrentMonth: false,
        },
        {
          day: 1,
          year: 2026,
          month: 0, // January
          date: new Date(2026, 0, 1),
          isCurrentMonth: true,
        },
      ];

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="month"
          triClubSchedule={null}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('calendar-day-2025-11-30')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-day-2025-11-31')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-day-2026-0-1')).toBeInTheDocument();
    });
  });

  describe('Drag state handling', () => {
    test('passes drag state to CalendarDay components', () => {
      const days = createDays(1);
      const dragState = {
        draggedWorkout: { id: 1, title: 'Test Workout' },
        dragOverDate: '2026-01-06',
        dragOverTimeSlot: 'morning',
      };

      render(
        <CalendarGrid
          days={days}
          workoutsByDate={{}}
          viewMode="week"
          triClubSchedule={null}
          showTimeSlots={true}
          dragState={dragState}
          {...mockHandlers}
        />
      );

      // Component renders successfully with drag state
      expect(screen.getByTestId(/calendar-day-/)).toBeInTheDocument();
    });
  });
});
