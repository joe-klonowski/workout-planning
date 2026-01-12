import {
  formatDuration,
  formatTime12Hour,
  getTimeSlot,
  groupWorkoutsByTimeOfDay,
  getWorkoutsForDay,
  getTimeOfDayLabel,
  getWorkoutsForCurrentWeek,
} from './workoutFormatters';
import { DateOnly } from './DateOnly';

describe('workoutFormatters', () => {
  describe('formatDuration', () => {
    it('should return empty string for 0 hours', () => {
      expect(formatDuration(0)).toBe('');
    });

    it('should format whole hours', () => {
      expect(formatDuration(2)).toBe('2h');
      expect(formatDuration(1)).toBe('1h');
    });

    it('should format minutes only', () => {
      expect(formatDuration(0.5)).toBe('30m');
      expect(formatDuration(0.25)).toBe('15m');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(1.5)).toBe('1h 30m');
      expect(formatDuration(2.75)).toBe('2h 45m');
    });

    it('should round minutes', () => {
      expect(formatDuration(1.333)).toBe('1h 20m');
    });
  });

  describe('formatTime12Hour', () => {
    it('should format morning times', () => {
      expect(formatTime12Hour('06:00')).toBe('6am');
      expect(formatTime12Hour('09:30')).toBe('9am');
      expect(formatTime12Hour('11:45')).toBe('11am');
    });

    it('should format afternoon/evening times', () => {
      expect(formatTime12Hour('12:00')).toBe('12pm');
      expect(formatTime12Hour('14:30')).toBe('2pm');
      expect(formatTime12Hour('18:00')).toBe('6pm');
      expect(formatTime12Hour('23:59')).toBe('11pm');
    });

    it('should format midnight', () => {
      expect(formatTime12Hour('00:00')).toBe('12am');
    });

    it('should format noon', () => {
      expect(formatTime12Hour('12:00')).toBe('12pm');
    });
  });

  describe('getTimeSlot', () => {
    it('should categorize morning times', () => {
      expect(getTimeSlot('05:00')).toBe('morning');
      expect(getTimeSlot('06:30')).toBe('morning');
      expect(getTimeSlot('11:59')).toBe('morning');
    });

    it('should categorize afternoon times', () => {
      expect(getTimeSlot('12:00')).toBe('afternoon');
      expect(getTimeSlot('14:30')).toBe('afternoon');
      expect(getTimeSlot('16:59')).toBe('afternoon');
    });

    it('should categorize evening times', () => {
      expect(getTimeSlot('17:00')).toBe('evening');
      expect(getTimeSlot('19:30')).toBe('evening');
      expect(getTimeSlot('21:59')).toBe('evening');
    });

    it('should categorize unscheduled times', () => {
      expect(getTimeSlot('00:00')).toBe('unscheduled');
      expect(getTimeSlot('04:59')).toBe('unscheduled');
      expect(getTimeSlot('22:00')).toBe('unscheduled');
      expect(getTimeSlot('23:59')).toBe('unscheduled');
    });
  });

  describe('groupWorkoutsByTimeOfDay', () => {
    const mockWorkouts = [
      { id: 1, title: 'Morning Run', timeOfDay: 'morning' },
      { id: 2, title: 'Afternoon Bike', timeOfDay: 'afternoon' },
      { id: 3, title: 'Evening Swim', timeOfDay: 'evening' },
      { id: 4, title: 'Unscheduled Workout', timeOfDay: null },
      { id: 5, title: 'Another Morning Run', timeOfDay: 'morning' },
      { id: 6, title: 'Unknown Time', timeOfDay: 'unknown' },
    ];

    it('should group workouts by time of day', () => {
      const grouped = groupWorkoutsByTimeOfDay(mockWorkouts);

      expect(grouped.morning).toHaveLength(2);
      expect(grouped.afternoon).toHaveLength(1);
      expect(grouped.evening).toHaveLength(1);
      expect(grouped.unscheduled).toHaveLength(2); // null and unknown
    });

    it('should handle empty workout array', () => {
      const grouped = groupWorkoutsByTimeOfDay([]);

      expect(grouped.morning).toHaveLength(0);
      expect(grouped.afternoon).toHaveLength(0);
      expect(grouped.evening).toHaveLength(0);
      expect(grouped.unscheduled).toHaveLength(0);
    });

    it('should handle all workouts in same time slot', () => {
      const allMorning = [
        { id: 1, timeOfDay: 'morning' },
        { id: 2, timeOfDay: 'morning' },
      ];

      const grouped = groupWorkoutsByTimeOfDay(allMorning);

      expect(grouped.morning).toHaveLength(2);
      expect(grouped.afternoon).toHaveLength(0);
      expect(grouped.evening).toHaveLength(0);
      expect(grouped.unscheduled).toHaveLength(0);
    });
  });

  describe('getWorkoutsForDay', () => {
    const mockWorkoutsByDate = {
      '2026-01-15': [
        { id: 1, title: 'Workout 1', isSelected: true },
        { id: 2, title: 'Workout 2', isSelected: false },
        { id: 3, title: 'Workout 3', isSelected: true },
      ],
      '2026-01-16': [
        { id: 4, title: 'Workout 4', isSelected: false },
      ],
    };

    it('should return workouts for a specific day', () => {
      const workouts = getWorkoutsForDay(15, 2026, 0, mockWorkoutsByDate);

      expect(workouts).toHaveLength(3);
      expect(workouts.map(w => w.id)).toEqual([1, 3, 2]); // Selected first
    });

    it('should return empty array for day with no workouts', () => {
      const workouts = getWorkoutsForDay(20, 2026, 0, mockWorkoutsByDate);

      expect(workouts).toEqual([]);
    });

    it('should return empty array for invalid day', () => {
      const workouts = getWorkoutsForDay(null, 2026, 0, mockWorkoutsByDate);

      expect(workouts).toEqual([]);
    });

    it('should sort selected workouts first', () => {
      const workouts = getWorkoutsForDay(15, 2026, 0, mockWorkoutsByDate);

      expect(workouts[0].isSelected).toBe(true);
      expect(workouts[1].isSelected).toBe(true);
      expect(workouts[2].isSelected).toBe(false);
    });

    it('should handle single-digit months and days with padding', () => {
      const mockData = {
        '2026-01-05': [{ id: 1, isSelected: true }],
      };

      const workouts = getWorkoutsForDay(5, 2026, 0, mockData);

      expect(workouts).toHaveLength(1);
    });
  });

  describe('getTimeOfDayLabel', () => {
    it('should return formatted label for known time slots', () => {
      expect(getTimeOfDayLabel('morning')).toBe('🌅 Morning');
      expect(getTimeOfDayLabel('afternoon')).toBe('☀️ Afternoon');
      expect(getTimeOfDayLabel('evening')).toBe('🌙 Evening');
      expect(getTimeOfDayLabel('unscheduled')).toBe('Unscheduled');
    });

    it('should return original value for unknown time slots', () => {
      expect(getTimeOfDayLabel('custom')).toBe('custom');
      expect(getTimeOfDayLabel('unknown')).toBe('unknown');
    });
  });

  describe('getWorkoutsForCurrentWeek', () => {
    const mockWorkouts = [
      { id: 1, workoutDate: new DateOnly(2026, 1, 13), isSelected: true }, // Tue
      { id: 2, workoutDate: new DateOnly(2026, 1, 14), isSelected: true }, // Wed
      { id: 3, workoutDate: new DateOnly(2026, 1, 15), isSelected: false }, // Thu
      { id: 4, workoutDate: new DateOnly(2026, 1, 16), isSelected: true }, // Fri
      { id: 5, workoutDate: new DateOnly(2026, 1, 20), isSelected: true }, // Next week
    ];

    it('should return all workouts for the current week', () => {
      // January 15, 2026 is a Thursday
      const currentDate = new Date(2026, 0, 15);
      const weekWorkouts = getWorkoutsForCurrentWeek(currentDate, mockWorkouts);

      expect(weekWorkouts).toHaveLength(4);
      expect(weekWorkouts.map(w => w.id).sort()).toEqual([1, 2, 3, 4]);
    });

    it('should handle week starting on Monday', () => {
      // January 12, 2026 is a Monday
      const currentDate = new Date(2026, 0, 12);
      const weekWorkouts = getWorkoutsForCurrentWeek(currentDate, mockWorkouts);

      expect(weekWorkouts).toHaveLength(4);
    });

    it('should handle week ending on Sunday', () => {
      // January 18, 2026 is a Sunday
      const currentDate = new Date(2026, 0, 18);
      const weekWorkouts = getWorkoutsForCurrentWeek(currentDate, mockWorkouts);

      expect(weekWorkouts).toHaveLength(4);
    });

    it('should return empty array when no workouts in week', () => {
      const currentDate = new Date(2026, 1, 1); // February
      const weekWorkouts = getWorkoutsForCurrentWeek(currentDate, mockWorkouts);

      expect(weekWorkouts).toEqual([]);
    });
  });
});
