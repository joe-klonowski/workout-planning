import { renderHook, act } from '@testing-library/react';
import { useCalendarDragDrop } from './useCalendarDragDrop';
import { DateOnly } from '../utils/DateOnly';

describe('useCalendarDragDrop', () => {
  let mockWorkout;
  let mockDayObj;
  let mockEvent;
  let mockDate;

  beforeEach(() => {
    mockDate = new Date(2026, 0, 15); // January 15, 2026
    mockWorkout = {
      id: 1,
      title: 'Test Workout',
      workoutDate: new DateOnly(2026, 1, 14),
      timeOfDay: 'morning',
    };
    mockDayObj = {
      year: 2026,
      month: 0, // January (0-indexed)
      day: 15,
      date: mockDate,
    };
    mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      target: {
        style: {},
      },
      dataTransfer: {
        effectAllowed: '',
        dropEffect: '',
        setData: jest.fn(),
      },
    };
  });

  describe('initial state', () => {
    it('should initialize with null/false values', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      expect(result.current.draggedWorkout).toBeNull();
      expect(result.current.showTimeSlots).toBe(false);
      expect(result.current.dragOverDate).toBeNull();
      expect(result.current.dragOverTimeSlot).toBeNull();
    });
  });

  describe('handleDragStart', () => {
    it('should set dragged workout and update visual state', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      expect(result.current.draggedWorkout).toEqual(mockWorkout);
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalled();
      expect(mockEvent.target.style.opacity).toBe('0.4');
    });

    it('should set showTimeSlots to true after delay', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useCalendarDragDrop());

      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      expect(result.current.showTimeSlots).toBe(false);

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(result.current.showTimeSlots).toBe(true);
      jest.useRealTimers();
    });
  });

  describe('handleDragEnd', () => {
    it('should reset all drag state', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      // First start a drag
      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
        result.current.handleDragOver(mockEvent, mockDate, 'afternoon');
      });

      expect(result.current.draggedWorkout).not.toBeNull();

      // Then end the drag
      act(() => {
        result.current.handleDragEnd(mockEvent);
      });

      expect(result.current.draggedWorkout).toBeNull();
      expect(result.current.showTimeSlots).toBe(false);
      expect(result.current.dragOverDate).toBeNull();
      expect(result.current.dragOverTimeSlot).toBeNull();
      expect(mockEvent.target.style.opacity).toBe('1');
    });
  });

  describe('handleDragOver', () => {
    it('should set drag over state with date and time slot', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      act(() => {
        result.current.handleDragOver(mockEvent, mockDate, 'afternoon');
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
      expect(result.current.dragOverDate).toBe(mockDate.toISOString());
      expect(result.current.dragOverTimeSlot).toBe('afternoon');
    });

    it('should work without time slot', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      act(() => {
        result.current.handleDragOver(mockEvent, mockDate);
      });

      expect(result.current.dragOverDate).toBe(mockDate.toISOString());
      expect(result.current.dragOverTimeSlot).toBeNull();
    });
  });

  describe('handleDragLeave', () => {
    it('should clear drag over state', () => {
      const { result } = renderHook(() => useCalendarDragDrop());

      // Set drag over state
      act(() => {
        result.current.handleDragOver(mockEvent, mockDate, 'evening');
      });

      expect(result.current.dragOverDate).not.toBeNull();

      // Leave drag zone
      act(() => {
        result.current.handleDragLeave();
      });

      expect(result.current.dragOverDate).toBeNull();
      expect(result.current.dragOverTimeSlot).toBeNull();
    });
  });

  describe('handleDrop', () => {
    it('should call onWorkoutDateChange when date changes', () => {
      const onWorkoutDateChange = jest.fn();
      const onWorkoutTimeOfDayChange = jest.fn();
      const { result } = renderHook(() => useCalendarDragDrop());

      // Start drag
      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      // Drop on different date
      act(() => {
        result.current.handleDrop(
          mockEvent,
          mockDayObj,
          'morning',
          onWorkoutDateChange,
          onWorkoutTimeOfDayChange
        );
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(onWorkoutDateChange).toHaveBeenCalledWith(
        mockWorkout.id,
        expect.any(Date)
      );
      expect(result.current.draggedWorkout).toBeNull();
      expect(result.current.showTimeSlots).toBe(false);
    });

    it('should call onWorkoutTimeOfDayChange when time slot changes', () => {
      const onWorkoutDateChange = jest.fn();
      const onWorkoutTimeOfDayChange = jest.fn();
      const { result } = renderHook(() => useCalendarDragDrop());

      // Start drag
      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      // Drop on same date but different time slot
      const sameDayObj = {
        year: 2026,
        month: 0, // January
        day: 14,
        date: new Date(2026, 0, 14),
      };

      act(() => {
        result.current.handleDrop(
          mockEvent,
          sameDayObj,
          'afternoon',
          onWorkoutDateChange,
          onWorkoutTimeOfDayChange
        );
      });

      expect(onWorkoutTimeOfDayChange).toHaveBeenCalledWith(
        mockWorkout.id,
        'afternoon'
      );
    });

    it('should not call callbacks when date and time slot are unchanged', () => {
      const onWorkoutDateChange = jest.fn();
      const onWorkoutTimeOfDayChange = jest.fn();
      const { result } = renderHook(() => useCalendarDragDrop());

      // Start drag
      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      // Drop on same date and same time slot
      const sameDayObj = {
        year: 2026,
        month: 0, // January
        day: 14,
        date: new Date(2026, 0, 14),
      };

      act(() => {
        result.current.handleDrop(
          mockEvent,
          sameDayObj,
          'morning',
          onWorkoutDateChange,
          onWorkoutTimeOfDayChange
        );
      });

      expect(onWorkoutDateChange).not.toHaveBeenCalled();
      expect(onWorkoutTimeOfDayChange).not.toHaveBeenCalled();
    });

    it('should handle drop without dragged workout', () => {
      const onWorkoutDateChange = jest.fn();
      const onWorkoutTimeOfDayChange = jest.fn();
      const { result } = renderHook(() => useCalendarDragDrop());

      // Drop without starting drag
      act(() => {
        result.current.handleDrop(
          mockEvent,
          mockDayObj,
          'afternoon',
          onWorkoutDateChange,
          onWorkoutTimeOfDayChange
        );
      });

      expect(onWorkoutDateChange).not.toHaveBeenCalled();
      expect(onWorkoutTimeOfDayChange).not.toHaveBeenCalled();
      expect(result.current.draggedWorkout).toBeNull();
    });

    it('should handle drop without time slot (month view)', () => {
      const onWorkoutDateChange = jest.fn();
      const onWorkoutTimeOfDayChange = jest.fn();
      const { result } = renderHook(() => useCalendarDragDrop());

      // Start drag
      act(() => {
        result.current.handleDragStart(mockEvent, mockWorkout);
      });

      // Drop without time slot
      act(() => {
        result.current.handleDrop(
          mockEvent,
          mockDayObj,
          null,
          onWorkoutDateChange,
          onWorkoutTimeOfDayChange
        );
      });

      expect(onWorkoutDateChange).toHaveBeenCalled();
      expect(onWorkoutTimeOfDayChange).toHaveBeenCalledWith(
        mockWorkout.id,
        null
      );
    });
  });
});
