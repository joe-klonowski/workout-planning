import { renderHook, act } from '@testing-library/react';
import { useCalendarNavigation } from './useCalendarNavigation';
import { DateOnly } from '../utils/DateOnly';

describe('useCalendarNavigation', () => {
  const initialDate = new DateOnly(2026, 1, 15); // January 15, 2026

  describe('initial state', () => {
    it('should initialize with the provided date', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      expect(result.current.currentDate).toEqual(new Date(2026, 0, 15));
    });
  });

  describe('goToPreviousMonth', () => {
    it('should navigate to the previous month', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      act(() => {
        result.current.goToPreviousMonth();
      });

      expect(result.current.currentDate.getMonth()).toBe(11); // December (0-indexed)
      expect(result.current.currentDate.getFullYear()).toBe(2025);
      expect(result.current.currentDate.getDate()).toBe(1);
    });

    it('should navigate to previous year when in January', () => {
      const januaryDate = new DateOnly(2026, 1, 15);
      const { result } = renderHook(() => useCalendarNavigation(januaryDate));

      act(() => {
        result.current.goToPreviousMonth();
      });

      expect(result.current.currentDate.getFullYear()).toBe(2025);
      expect(result.current.currentDate.getMonth()).toBe(11); // December
    });
  });

  describe('goToNextMonth', () => {
    it('should navigate to the next month', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      act(() => {
        result.current.goToNextMonth();
      });

      expect(result.current.currentDate.getMonth()).toBe(1); // February (0-indexed)
      expect(result.current.currentDate.getFullYear()).toBe(2026);
      expect(result.current.currentDate.getDate()).toBe(1);
    });

    it('should navigate to next year when in December', () => {
      const decemberDate = new DateOnly(2025, 12, 15);
      const { result } = renderHook(() => useCalendarNavigation(decemberDate));

      act(() => {
        result.current.goToNextMonth();
      });

      expect(result.current.currentDate.getFullYear()).toBe(2026);
      expect(result.current.currentDate.getMonth()).toBe(0); // January
    });
  });

  describe('goToPreviousWeek', () => {
    it('should navigate to the previous week', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.currentDate.getDate()).toBe(8); // January 8
      expect(result.current.currentDate.getMonth()).toBe(0); // January
      expect(result.current.currentDate.getFullYear()).toBe(2026);
    });

    it('should navigate to previous month when crossing month boundary', () => {
      const earlyMonthDate = new DateOnly(2026, 1, 5);
      const { result } = renderHook(() => useCalendarNavigation(earlyMonthDate));

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.currentDate.getMonth()).toBe(11); // December (0-indexed)
      expect(result.current.currentDate.getFullYear()).toBe(2025);
      expect(result.current.currentDate.getDate()).toBe(29); // December 29
    });
  });

  describe('goToNextWeek', () => {
    it('should navigate to the next week', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentDate.getDate()).toBe(22); // January 22
      expect(result.current.currentDate.getMonth()).toBe(0); // January
      expect(result.current.currentDate.getFullYear()).toBe(2026);
    });

    it('should navigate to next month when crossing month boundary', () => {
      const lateMonthDate = new DateOnly(2026, 1, 28);
      const { result } = renderHook(() => useCalendarNavigation(lateMonthDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentDate.getMonth()).toBe(1); // February (0-indexed)
      expect(result.current.currentDate.getFullYear()).toBe(2026);
      expect(result.current.currentDate.getDate()).toBe(4); // February 4
    });
  });

  describe('goToToday', () => {
    it('should navigate to current date', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));
      const today = new Date();

      act(() => {
        result.current.goToToday();
      });

      expect(result.current.currentDate.getFullYear()).toBe(today.getFullYear());
      expect(result.current.currentDate.getMonth()).toBe(today.getMonth());
      expect(result.current.currentDate.getDate()).toBe(today.getDate());
    });
  });

  describe('setCurrentDate', () => {
    it('should allow direct date setting', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));
      const newDate = new Date(2026, 5, 20); // June 20, 2026

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });
  });

  describe('navigation sequences', () => {
    it('should handle multiple navigation operations', () => {
      const { result } = renderHook(() => useCalendarNavigation(initialDate));

      // Go forward a week
      act(() => {
        result.current.goToNextWeek();
      });
      expect(result.current.currentDate.getDate()).toBe(22);

      // Go forward another month
      act(() => {
        result.current.goToNextMonth();
      });
      expect(result.current.currentDate.getMonth()).toBe(1); // February

      // Go back to today
      act(() => {
        result.current.goToToday();
      });
      const today = new Date();
      expect(result.current.currentDate.getDate()).toBe(today.getDate());
    });
  });
});
