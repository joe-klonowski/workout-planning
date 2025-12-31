/**
 * DateOnly class - Represents a date without timezone information
 * Stores year, month, and day independently to avoid timezone conversion issues
 * 
 * Why this exists:
 * JavaScript's Date object always includes timezone information. When a coach schedules
 * a workout for "January 15", it should be completed on January 15 in the athlete's
 * LOCAL timezone, regardless of where the athlete or coach are located. A DateOnly value represents
 * this intent without timezone ambiguity.
 */
export class DateOnly {
  /**
   * Create a DateOnly instance
   * @param {number} year - The year (e.g., 2026)
   * @param {number} month - The month (1-12, unlike JS Date which uses 0-11)
   * @param {number} day - The day of month (1-31)
   */
  constructor(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      throw new Error('DateOnly requires integer year, month, and day');
    }
    
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    
    if (day < 1 || day > 31) {
      throw new Error('Day must be between 1 and 31');
    }

    this.year = year;
    this.month = month; // 1-12 (human-readable, unlike JS Date)
    this.day = day;
  }

  /**
   * Parse a date string in YYYY-MM-DD format
   * @param {string} dateString - Date string (e.g., "2026-01-15")
   * @returns {DateOnly} DateOnly instance
   * @throws {Error} If the string is not in valid YYYY-MM-DD format
   */
  static fromString(dateString) {
    if (typeof dateString !== 'string') {
      throw new Error('Date string must be a string');
    }

    const trimmed = dateString.trim();
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = trimmed.match(dateRegex);

    if (!match) {
      throw new Error(`Invalid date format. Expected YYYY-MM-DD, got "${trimmed}"`);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    return new DateOnly(year, month, day);
  }

  /**
   * Create a DateOnly from a JavaScript Date object
   * Interprets the Date in the system's local timezone
   * @param {Date} date - A JavaScript Date object
   * @returns {DateOnly} DateOnly instance
   */
  static fromDate(date) {
    if (!(date instanceof Date)) {
      throw new Error('Argument must be a Date instance');
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid Date object');
    }

    return new DateOnly(
      date.getFullYear(),
      date.getMonth() + 1, // Convert from 0-11 to 1-12
      date.getDate()
    );
  }

  /**
   * Convert to ISO string format (YYYY-MM-DD)
   * @returns {string} Date string in YYYY-MM-DD format
   */
  toISOString() {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
  }

  /**
   * Convert to a JavaScript Date object at midnight in local time
   * Note: This Date object will have timezone info, but we're only using it for display/comparison
   * @returns {Date} Date object at midnight local time
   */
  toDate() {
    // Use the local Date constructor to avoid timezone offset
    return new Date(this.year, this.month - 1, this.day);
  }

  /**
   * Get a human-readable string representation
   * @returns {string} Formatted date string (e.g., "Jan 15, 2026")
   */
  toString() {
    const date = this.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Compare two DateOnly objects
   * @param {DateOnly} other - Another DateOnly instance
   * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
   */
  compareTo(other) {
    if (!(other instanceof DateOnly)) {
      throw new Error('Can only compare with another DateOnly instance');
    }

    if (this.year !== other.year) {
      return this.year < other.year ? -1 : 1;
    }
    if (this.month !== other.month) {
      return this.month < other.month ? -1 : 1;
    }
    if (this.day !== other.day) {
      return this.day < other.day ? -1 : 1;
    }
    return 0;
  }

  /**
   * Check if two DateOnly objects represent the same date
   * @param {DateOnly} other - Another DateOnly instance
   * @returns {boolean} True if dates are equal
   */
  equals(other) {
    if (!(other instanceof DateOnly)) {
      return false;
    }
    return this.year === other.year && this.month === other.month && this.day === other.day;
  }

  /**
   * Check if this date is before another
   * @param {DateOnly} other - Another DateOnly instance
   * @returns {boolean}
   */
  isBefore(other) {
    return this.compareTo(other) < 0;
  }

  /**
   * Check if this date is after another
   * @param {DateOnly} other - Another DateOnly instance
   * @returns {boolean}
   */
  isAfter(other) {
    return this.compareTo(other) > 0;
  }

  /**
   * Check if this date is between two other dates (inclusive)
   * @param {DateOnly} start - Start date
   * @param {DateOnly} end - End date
   * @returns {boolean}
   */
  isBetween(start, end) {
    return this.compareTo(start) >= 0 && this.compareTo(end) <= 0;
  }
}
