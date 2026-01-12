import { getTriClubEventsByTimeSlot } from './triClubUtils';

describe('triClubUtils', () => {
  describe('getTriClubEventsByTimeSlot', () => {
    const mockTriClubSchedule = {
      effective_date: '2026-01-01',
      schedule: {
        monday: [
          { time: '06:00', activity: 'Swim' },
          { time: '18:00', activity: 'Run' },
        ],
        tuesday: [
          { time: '12:00', activity: 'Bike' },
        ],
        wednesday: [
          { time: '06:30', activity: 'Swim' },
          { time: '19:00', activity: 'Track' },
        ],
        thursday: [],
        friday: [
          { time: '17:30', activity: 'Run' },
        ],
        saturday: [
          { time: '08:00', activity: 'Long Ride' },
        ],
        sunday: [
          { time: '09:00', activity: 'Long Run' },
        ],
      },
    };

    it('should return events grouped by time slot for Monday', () => {
      // January 12, 2026 is a Monday
      const monday = new Date(2026, 0, 12);
      const grouped = getTriClubEventsByTimeSlot(monday, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(1);
      expect(grouped.morning[0].activity).toBe('Swim');
      expect(grouped.morning[0].formattedTime).toBe('6am');

      expect(grouped.afternoon).toHaveLength(0);

      expect(grouped.evening).toHaveLength(1);
      expect(grouped.evening[0].activity).toBe('Run');
      expect(grouped.evening[0].formattedTime).toBe('6pm');

      expect(grouped.unscheduled).toHaveLength(0);
    });

    it('should return events for Tuesday', () => {
      // January 13, 2026 is a Tuesday
      const tuesday = new Date(2026, 0, 13);
      const grouped = getTriClubEventsByTimeSlot(tuesday, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(0);
      expect(grouped.afternoon).toHaveLength(1);
      expect(grouped.afternoon[0].activity).toBe('Bike');
      expect(grouped.afternoon[0].formattedTime).toBe('12pm');
      expect(grouped.evening).toHaveLength(0);
    });

    it('should return multiple events for Wednesday', () => {
      // January 14, 2026 is a Wednesday
      const wednesday = new Date(2026, 0, 14);
      const grouped = getTriClubEventsByTimeSlot(wednesday, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(1);
      expect(grouped.morning[0].activity).toBe('Swim');

      expect(grouped.evening).toHaveLength(1);
      expect(grouped.evening[0].activity).toBe('Track');
    });

    it('should return empty arrays for Thursday (no events)', () => {
      // January 15, 2026 is a Thursday
      const thursday = new Date(2026, 0, 15);
      const grouped = getTriClubEventsByTimeSlot(thursday, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(0);
      expect(grouped.afternoon).toHaveLength(0);
      expect(grouped.evening).toHaveLength(0);
      expect(grouped.unscheduled).toHaveLength(0);
    });

    it('should handle Sunday', () => {
      // January 18, 2026 is a Sunday
      const sunday = new Date(2026, 0, 18);
      const grouped = getTriClubEventsByTimeSlot(sunday, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(1);
      expect(grouped.morning[0].activity).toBe('Long Run');
      expect(grouped.morning[0].formattedTime).toBe('9am');
    });

    it('should return empty structure when triClubSchedule is null', () => {
      const monday = new Date(2026, 0, 12);
      const grouped = getTriClubEventsByTimeSlot(monday, null);

      expect(grouped).toEqual({
        morning: [],
        afternoon: [],
        evening: [],
        unscheduled: [],
      });
    });

    it('should return empty structure when schedule property is missing', () => {
      const monday = new Date(2026, 0, 12);
      const grouped = getTriClubEventsByTimeSlot(monday, { effective_date: '2026-01-01' });

      expect(grouped).toEqual({
        morning: [],
        afternoon: [],
        evening: [],
        unscheduled: [],
      });
    });

    it('should handle events in unscheduled time slot', () => {
      const lateSchedule = {
        schedule: {
          monday: [
            { time: '23:00', activity: 'Late Night Run' },
          ],
        },
      };

      const monday = new Date(2026, 0, 12);
      const grouped = getTriClubEventsByTimeSlot(monday, lateSchedule);

      expect(grouped.unscheduled).toHaveLength(1);
      expect(grouped.unscheduled[0].activity).toBe('Late Night Run');
      expect(grouped.unscheduled[0].formattedTime).toBe('11pm');
    });

    it('should preserve original event properties', () => {
      const monday = new Date(2026, 0, 12);
      const grouped = getTriClubEventsByTimeSlot(monday, mockTriClubSchedule);

      expect(grouped.morning[0]).toMatchObject({
        time: '06:00',
        activity: 'Swim',
        formattedTime: '6am',
      });
    });

    it('should handle different years', () => {
      const monday2025 = new Date(2025, 0, 13); // January 13, 2025 is a Monday
      const grouped = getTriClubEventsByTimeSlot(monday2025, mockTriClubSchedule);

      expect(grouped.morning).toHaveLength(1);
      expect(grouped.evening).toHaveLength(1);
    });

    it('should handle edge case of midnight', () => {
      const midnightSchedule = {
        schedule: {
          saturday: [
            { time: '00:00', activity: 'Midnight Workout' },
          ],
        },
      };

      const saturday = new Date(2026, 0, 17); // January 17, 2026 is a Saturday
      const grouped = getTriClubEventsByTimeSlot(saturday, midnightSchedule);

      expect(grouped.unscheduled).toHaveLength(1);
      expect(grouped.unscheduled[0].formattedTime).toBe('12am');
    });
  });
});
