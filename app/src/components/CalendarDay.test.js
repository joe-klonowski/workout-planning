import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarDay from './CalendarDay';
import { DateOnly } from '../utils/DateOnly';

// Mock child components
jest.mock('./DayTimeSlot', () => {
  return function MockDayTimeSlot({ timeSlot, workouts, triClubEvents }) {
    return (
      <div data-testid={`time-slot-${timeSlot}`}>
        <div data-testid={`time-slot-${timeSlot}-workouts-count`}>{workouts.length}</div>
        <div data-testid={`time-slot-${timeSlot}-events-count`}>{triClubEvents.length}</div>
      </div>
    );
  };
});

jest.mock('./WorkoutBadge', () => {
  return function MockWorkoutBadge({ workout, onWorkoutClick }) {
    return (
      <div 
        data-testid={`workout-badge-${workout.id}`}
        onClick={onWorkoutClick}
      >
        {workout.title}
      </div>
    );
  };
});

describe('CalendarDay Component', () => {
  const mockDate = new Date(2026, 0, 15); // January 15, 2026
  
  const mockDayObj = {
    day: 15,
    year: 2026,
    month: 0,
    date: mockDate,
    isCurrentMonth: true,
  };

  const mockWorkouts = [
    {
      id: 1,
      title: 'Morning Run',
      workoutType: 'Run',
      timeOfDay: 'morning',
      isSelected: false,
    },
    {
      id: 2,
      title: 'Evening Swim',
      workoutType: 'Swim',
      timeOfDay: 'evening',
      isSelected: true,
    },
  ];

  const mockTriClubSchedule = {
    effective_date: '2026-01-01',
    schedule: {
      thursday: [
        { time: '06:00', activity: 'Swim' },
        { time: '18:00', activity: 'Run' },
      ],
    },
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Week View', () => {
    it('should render day number', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should render with is-today class when isToday is true', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={true}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('is-today');
    });

    it('should render time-slot-mode class in week view', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('time-slot-mode');
    });

    it('should render three main time slots (morning, afternoon, evening)', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('time-slot-morning')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-afternoon')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-evening')).toBeInTheDocument();
    });

    it('should distribute workouts to correct time slots', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={mockWorkouts}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Morning should have 1 workout
      expect(screen.getByTestId('time-slot-morning-workouts-count')).toHaveTextContent('1');
      // Afternoon should have 0 workouts
      expect(screen.getByTestId('time-slot-afternoon-workouts-count')).toHaveTextContent('0');
      // Evening should have 1 workout
      expect(screen.getByTestId('time-slot-evening-workouts-count')).toHaveTextContent('1');
    });

    it('should render unscheduled time slot when there are unscheduled workouts', () => {
      const workoutsWithUnscheduled = [
        ...mockWorkouts,
        {
          id: 3,
          title: 'Unscheduled Bike',
          workoutType: 'Bike',
          timeOfDay: 'unscheduled',
          isSelected: false,
        },
      ];

      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={workoutsWithUnscheduled}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('time-slot-unscheduled')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-unscheduled-workouts-count')).toHaveTextContent('1');
    });

    it('should not render unscheduled time slot when there are no unscheduled workouts', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={mockWorkouts}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.queryByTestId('time-slot-unscheduled')).not.toBeInTheDocument();
    });

    it('should pass tri-club events to time slots', () => {
      // Thursday is day 4 (0=Sunday)
      const thursdayDate = new Date(2026, 0, 15); // This is a Thursday
      const thursdayDayObj = {
        ...mockDayObj,
        date: thursdayDate,
      };

      render(
        <CalendarDay
          dayObj={thursdayDayObj}
          workouts={[]}
          triClubSchedule={mockTriClubSchedule}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Morning should have 1 event (06:00 Swim)
      expect(screen.getByTestId('time-slot-morning-events-count')).toHaveTextContent('1');
      // Evening should have 1 event (18:00 Run)
      expect(screen.getByTestId('time-slot-evening-events-count')).toHaveTextContent('1');
    });
  });

  describe('Month View', () => {
    it('should render day number', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should render with is-today class when isToday is true', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={true}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('is-today');
    });

    it('should render with has-date class', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('has-date');
    });

    it('should render with other-month class when not in current month', () => {
      const otherMonthDayObj = {
        ...mockDayObj,
        isCurrentMonth: false,
      };

      const { container } = render(
        <CalendarDay
          dayObj={otherMonthDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('other-month');
    });

    it('should render workouts as badges', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={mockWorkouts}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('workout-badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('workout-badge-2')).toBeInTheDocument();
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    });

    it('should render "Rest day" when there are no workouts', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Rest day')).toBeInTheDocument();
    });

    it('should call onWorkoutClick when workout badge is clicked', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={mockWorkouts}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByTestId('workout-badge-1'));
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should add drag-over class when dragging over in month view', () => {
      const dragStateWithDrag = {
        draggedWorkout: { id: 1, title: 'Test' },
        dragOverDate: mockDate.toISOString(),
        dragOverTimeSlot: null,
      };

      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={dragStateWithDrag}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('drag-over');
    });

    it('should not add drag-over class when dragging over with time slot specified', () => {
      const dragStateWithTimeSlot = {
        draggedWorkout: { id: 1, title: 'Test' },
        dragOverDate: mockDate.toISOString(),
        dragOverTimeSlot: 'morning',
      };

      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={dragStateWithTimeSlot}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).not.toHaveClass('drag-over');
    });

    it('should call onDragOver when dragging over in month view', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      fireEvent.dragOver(dayElement, { dataTransfer: {} });
      
      expect(mockHandlers.onDragOver).toHaveBeenCalled();
    });

    it('should call onDragLeave when drag leaves in month view', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      fireEvent.dragLeave(dayElement, { dataTransfer: {} });
      
      expect(mockHandlers.onDragLeave).toHaveBeenCalled();
    });

    it('should call onDrop when dropping in month view', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      const dayElement = container.querySelector('.calendar-day');
      fireEvent.drop(dayElement, { dataTransfer: {} });
      
      expect(mockHandlers.onDrop).toHaveBeenCalled();
    });
  });

  describe('PropTypes and Defaults', () => {
    it('should use default values for optional props', () => {
      const { container } = render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Should render without errors
      expect(container.querySelector('.calendar-day')).toBeInTheDocument();
    });

    it('should handle missing triClubSchedule gracefully', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={mockWorkouts}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Should render all time slots with 0 events
      expect(screen.getByTestId('time-slot-morning-events-count')).toHaveTextContent('0');
      expect(screen.getByTestId('time-slot-afternoon-events-count')).toHaveTextContent('0');
      expect(screen.getByTestId('time-slot-evening-events-count')).toHaveTextContent('0');
    });

    it('should handle empty workouts array', () => {
      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // All time slots should have 0 workouts
      expect(screen.getByTestId('time-slot-morning-workouts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('time-slot-afternoon-workouts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('time-slot-evening-workouts-count')).toHaveTextContent('0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle workouts without timeOfDay (defaults to unscheduled)', () => {
      const workoutWithoutTimeOfDay = [
        {
          id: 1,
          title: 'Workout',
          workoutType: 'Run',
          isSelected: false,
        },
      ];

      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={workoutWithoutTimeOfDay}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      // Should render in unscheduled slot
      expect(screen.getByTestId('time-slot-unscheduled')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-unscheduled-workouts-count')).toHaveTextContent('1');
    });

    it('should handle multiple workouts in same time slot', () => {
      const multipleWorkouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          timeOfDay: 'morning',
          isSelected: false,
        },
        {
          id: 2,
          title: 'Morning Swim',
          workoutType: 'Swim',
          timeOfDay: 'morning',
          isSelected: false,
        },
      ];

      render(
        <CalendarDay
          dayObj={mockDayObj}
          workouts={multipleWorkouts}
          triClubSchedule={null}
          viewMode="week"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('time-slot-morning-workouts-count')).toHaveTextContent('2');
    });

    it('should handle day from different month in month view', () => {
      const prevMonthDayObj = {
        day: 31,
        year: 2025,
        month: 11, // December
        date: new Date(2025, 11, 31),
        isCurrentMonth: false,
      };

      const { container } = render(
        <CalendarDay
          dayObj={prevMonthDayObj}
          workouts={[]}
          triClubSchedule={null}
          viewMode="month"
          isToday={false}
          showTimeSlots={false}
          dragState={mockDragState}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('31')).toBeInTheDocument();
      const dayElement = container.querySelector('.calendar-day');
      expect(dayElement).toHaveClass('other-month');
    });
  });
});
