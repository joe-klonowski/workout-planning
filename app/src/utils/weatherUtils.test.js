import {
  getWeatherInfo,
  isWeatherAvailable,
  getMaxWeatherForecastDate
} from './weatherUtils';

// Helper function to convert Date to local date string (YYYY-MM-DD)
const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

describe('weatherUtils', () => {
  describe('getWeatherInfo', () => {
    test('should return clear sky info for code 0', () => {
      const info = getWeatherInfo(0);
      expect(info.description).toBe('Clear sky');
      expect(info.emoji).toBe('☀️');
      expect(info.badgeClass).toBe('weather-clear');
    });

    test('should return rain info for code 61', () => {
      const info = getWeatherInfo(61);
      expect(info.description).toBe('Slight rain');
      expect(info.emoji).toBe('🌧️');
      expect(info.badgeClass).toBe('weather-rain');
    });

    test('should return thunderstorm info for code 95', () => {
      const info = getWeatherInfo(95);
      expect(info.description).toBe('Thunderstorm');
      expect(info.emoji).toBe('⛈️');
      expect(info.badgeClass).toBe('weather-thunderstorm');
    });

    test('should return unknown for invalid code', () => {
      const info = getWeatherInfo(999);
      expect(info.description).toBe('Unknown weather');
      expect(info.emoji).toBe('❓');
      expect(info.badgeClass).toBe('weather-unknown');
    });
  });

  describe('isWeatherAvailable', () => {
    test('should return true for today', () => {
      const today = toLocalDateString(new Date());
      expect(isWeatherAvailable(today)).toBe(true);
    });

    test('should return true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = toLocalDateString(tomorrow);
      expect(isWeatherAvailable(dateString)).toBe(true);
    });

    test('should return true for 10 days from now', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = toLocalDateString(futureDate);
      expect(isWeatherAvailable(dateString)).toBe(true);
    });

    test('should return true for 16 days from now (boundary)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 16);
      const dateString = toLocalDateString(futureDate);
      expect(isWeatherAvailable(dateString)).toBe(true);
    });

    test('should return false for 17 days from now', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 17);
      const dateString = toLocalDateString(futureDate);
      expect(isWeatherAvailable(dateString)).toBe(false);
    });

    test('should return false for 30 days from now', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = toLocalDateString(futureDate);
      expect(isWeatherAvailable(dateString)).toBe(false);
    });

    test('should return false for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = toLocalDateString(yesterday);
      expect(isWeatherAvailable(dateString)).toBe(false);
    });

    test('should return false for null date', () => {
      expect(isWeatherAvailable(null)).toBe(false);
    });

    test('should return false for undefined date', () => {
      expect(isWeatherAvailable(undefined)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isWeatherAvailable('')).toBe(false);
    });

    test('should return false for invalid date string', () => {
      expect(isWeatherAvailable('not-a-date')).toBe(false);
    });
  });

  describe('getMaxWeatherForecastDate', () => {
    test('should return a date 16 days from now', () => {
      const maxDate = getMaxWeatherForecastDate();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 16);
      const expectedString = toLocalDateString(expectedDate);
      
      expect(maxDate).toBe(expectedString);
    });

    test('should return date in ISO format (YYYY-MM-DD)', () => {
      const maxDate = getMaxWeatherForecastDate();
      expect(maxDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
