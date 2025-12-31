import { DateOnly } from './DateOnly';

describe('DateOnly', () => {
  describe('constructor', () => {
    it('should create a DateOnly instance with valid values', () => {
      const date = new DateOnly(2026, 1, 15);
      expect(date.year).toBe(2026);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
    });

    it('should throw error for non-integer values', () => {
      expect(() => new DateOnly(2026.5, 1, 15)).toThrow('DateOnly requires integer year, month, and day');
      expect(() => new DateOnly(2026, 1.5, 15)).toThrow('DateOnly requires integer year, month, and day');
      expect(() => new DateOnly(2026, 1, 15.5)).toThrow('DateOnly requires integer year, month, and day');
    });

    it('should throw error for invalid month', () => {
      expect(() => new DateOnly(2026, 0, 15)).toThrow('Month must be between 1 and 12');
      expect(() => new DateOnly(2026, 13, 15)).toThrow('Month must be between 1 and 12');
    });

    it('should throw error for invalid day', () => {
      expect(() => new DateOnly(2026, 1, 0)).toThrow('Day must be between 1 and 31');
      expect(() => new DateOnly(2026, 1, 32)).toThrow('Day must be between 1 and 31');
    });
  });

  describe('fromString', () => {
    it('should parse valid YYYY-MM-DD format', () => {
      const date = DateOnly.fromString('2026-01-15');
      expect(date.year).toBe(2026);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
    });

    it('should handle leading/trailing whitespace', () => {
      const date = DateOnly.fromString('  2026-01-15  ');
      expect(date.year).toBe(2026);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
    });

    it('should throw error for invalid format', () => {
      expect(() => DateOnly.fromString('2026/01/15')).toThrow('Invalid date format');
      expect(() => DateOnly.fromString('01-15-2026')).toThrow('Invalid date format');
      expect(() => DateOnly.fromString('2026-1-15')).toThrow('Invalid date format');
      expect(() => DateOnly.fromString('invalid')).toThrow('Invalid date format');
    });

    it('should throw error for non-string input', () => {
      expect(() => DateOnly.fromString(20260115)).toThrow('Date string must be a string');
      expect(() => DateOnly.fromString(null)).toThrow('Date string must be a string');
      expect(() => DateOnly.fromString(undefined)).toThrow('Date string must be a string');
    });
  });

  describe('fromDate', () => {
    it('should create DateOnly from Date object', () => {
      const jsDate = new Date(2026, 0, 15); // JavaScript Date uses 0-11 for months
      const dateOnly = DateOnly.fromDate(jsDate);
      expect(dateOnly.year).toBe(2026);
      expect(dateOnly.month).toBe(1);
      expect(dateOnly.day).toBe(15);
    });

    it('should throw error for non-Date input', () => {
      expect(() => DateOnly.fromDate('2026-01-15')).toThrow('Argument must be a Date instance');
      expect(() => DateOnly.fromDate(null)).toThrow('Argument must be a Date instance');
    });

    it('should throw error for invalid Date', () => {
      expect(() => DateOnly.fromDate(new Date('invalid'))).toThrow('Invalid Date object');
    });
  });

  describe('toISOString', () => {
    it('should return YYYY-MM-DD format', () => {
      const date = new DateOnly(2026, 1, 15);
      expect(date.toISOString()).toBe('2026-01-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new DateOnly(2026, 3, 5);
      expect(date.toISOString()).toBe('2026-03-05');
    });
  });

  describe('toDate', () => {
    it('should convert to JavaScript Date at midnight local time', () => {
      const dateOnly = new DateOnly(2026, 1, 15);
      const jsDate = dateOnly.toDate();

      expect(jsDate.getFullYear()).toBe(2026);
      expect(jsDate.getMonth()).toBe(0); // JavaScript uses 0-11
      expect(jsDate.getDate()).toBe(15);
    });
  });

  describe('toString', () => {
    it('should return human-readable format', () => {
      const date = new DateOnly(2026, 1, 15);
      const result = date.toString();
      expect(result).toMatch(/Jan 15, 2026/);
    });

    it('should work with all months', () => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      months.forEach((month, index) => {
        const date = new DateOnly(2026, index + 1, 15);
        expect(date.toString()).toContain(month);
        expect(date.toString()).toContain('15');
        expect(date.toString()).toContain('2026');
      });
    });
  });

  describe('compareTo', () => {
    it('should return 0 for equal dates', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.compareTo(date2)).toBe(0);
    });

    it('should return -1 for earlier date', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 20);
      expect(date1.compareTo(date2)).toBe(-1);
    });

    it('should return 1 for later date', () => {
      const date1 = new DateOnly(2026, 2, 15);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.compareTo(date2)).toBe(1);
    });

    it('should compare years first', () => {
      const date1 = new DateOnly(2025, 12, 31);
      const date2 = new DateOnly(2026, 1, 1);
      expect(date1.compareTo(date2)).toBe(-1);
    });

    it('should throw error for non-DateOnly comparison', () => {
      const date = new DateOnly(2026, 1, 15);
      expect(() => date.compareTo('2026-01-15')).toThrow('Can only compare with another DateOnly instance');
    });
  });

  describe('equals', () => {
    it('should return true for equal dates', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.equals(date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 16);
      expect(date1.equals(date2)).toBe(false);
    });

    it('should return false for non-DateOnly values', () => {
      const date = new DateOnly(2026, 1, 15);
      expect(date.equals('2026-01-15')).toBe(false);
      expect(date.equals(null)).toBe(false);
      expect(date.equals(undefined)).toBe(false);
    });
  });

  describe('isBefore', () => {
    it('should return true if this date is before other', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 20);
      expect(date1.isBefore(date2)).toBe(true);
    });

    it('should return false if this date is after other', () => {
      const date1 = new DateOnly(2026, 1, 20);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.isBefore(date2)).toBe(false);
    });

    it('should return false if dates are equal', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.isBefore(date2)).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true if this date is after other', () => {
      const date1 = new DateOnly(2026, 1, 20);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.isAfter(date2)).toBe(true);
    });

    it('should return false if this date is before other', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 20);
      expect(date1.isAfter(date2)).toBe(false);
    });

    it('should return false if dates are equal', () => {
      const date1 = new DateOnly(2026, 1, 15);
      const date2 = new DateOnly(2026, 1, 15);
      expect(date1.isAfter(date2)).toBe(false);
    });
  });

  describe('isBetween', () => {
    it('should return true if date is between start and end (inclusive)', () => {
      const date = new DateOnly(2026, 1, 15);
      const start = new DateOnly(2026, 1, 10);
      const end = new DateOnly(2026, 1, 20);
      expect(date.isBetween(start, end)).toBe(true);
    });

    it('should return true if date equals start boundary', () => {
      const date = new DateOnly(2026, 1, 10);
      const start = new DateOnly(2026, 1, 10);
      const end = new DateOnly(2026, 1, 20);
      expect(date.isBetween(start, end)).toBe(true);
    });

    it('should return true if date equals end boundary', () => {
      const date = new DateOnly(2026, 1, 20);
      const start = new DateOnly(2026, 1, 10);
      const end = new DateOnly(2026, 1, 20);
      expect(date.isBetween(start, end)).toBe(true);
    });

    it('should return false if date is before start', () => {
      const date = new DateOnly(2026, 1, 5);
      const start = new DateOnly(2026, 1, 10);
      const end = new DateOnly(2026, 1, 20);
      expect(date.isBetween(start, end)).toBe(false);
    });

    it('should return false if date is after end', () => {
      const date = new DateOnly(2026, 1, 25);
      const start = new DateOnly(2026, 1, 10);
      const end = new DateOnly(2026, 1, 20);
      expect(date.isBetween(start, end)).toBe(false);
    });
  });

  describe('timezone independence', () => {
    it('should represent same date regardless of system timezone', () => {
      const date = new DateOnly(2026, 1, 15);
      
      // The same DateOnly object should always represent the same date
      expect(date.year).toBe(2026);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
      expect(date.toISOString()).toBe('2026-01-15');
    });

    it('should not be affected by daylight saving time', () => {
      // Create DateOnly for a date that spans DST boundary
      const dateBeforeDST = new DateOnly(2026, 3, 7);
      const dateAfterDST = new DateOnly(2026, 3, 8);
      
      expect(dateBeforeDST.toISOString()).toBe('2026-03-07');
      expect(dateAfterDST.toISOString()).toBe('2026-03-08');
    });
  });
});
