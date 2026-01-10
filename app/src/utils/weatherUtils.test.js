import {
  getWeatherInfo
} from './weatherUtils';

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
});
