import { weatherCache } from './weatherCache';

// Create a simple localStorage mock
let mockStore = {};

// Create localStorage mock with proper mockStore reference
const createLocalStorageMock = () => {
  return {
    getItem: (key) => mockStore[key] || null,
    setItem: (key, value) => {
      mockStore[key] = value.toString();
    },
    removeItem: (key) => {
      delete mockStore[key];
    },
    clear: () => {
      Object.keys(mockStore).forEach(key => delete mockStore[key]);
    }
  };
};

// Initial setup of localStorage
global.localStorage = createLocalStorageMock();

// Mock Object.keys to return the keys from mockStore when called on localStorage
const originalObjectKeys = Object.keys;
global.Object.keys = function(obj) {
  if (obj === global.localStorage || obj === localStorage) {
    return originalObjectKeys(mockStore);
  }
  return originalObjectKeys(obj);
};

describe('weatherCache', () => {
  beforeEach(() => {
    // Clear mockStore properties without reassigning the object
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
    
    // Re-apply our mock to override any default
    Object.defineProperty(global, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true
    });
    
    weatherCache.clear();
    weatherCache.loadFromLocalStorage();
    // Clear any intervals
    if (weatherCache.cleanupInterval) {
      clearInterval(weatherCache.cleanupInterval);
      weatherCache.cleanupInterval = null;
    }
  });

  afterEach(() => {
    // Clear mockStore properties without reassigning the object
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
    weatherCache.clear();
    // Clear any intervals
    if (weatherCache.cleanupInterval) {
      clearInterval(weatherCache.cleanupInterval);
      weatherCache.cleanupInterval = null;
    }
  });

  describe('getCacheKey', () => {
    test('should generate key without time slot', () => {
      const key = weatherCache.getCacheKey('2026-01-15');
      expect(key).toBe('2026-01-15');
    });

    test('should generate key with time slot', () => {
      const key = weatherCache.getCacheKey('2026-01-15', 'morning');
      expect(key).toBe('2026-01-15-morning');
    });
  });

  describe('set and get', () => {
    test('should store and retrieve weather data without time slot', () => {
      const weatherData = {
        temperature: 65,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 1
      };

      weatherCache.set('2026-01-15', null, weatherData);
      const retrieved = weatherCache.get('2026-01-15');

      expect(retrieved).toEqual(weatherData);
    });

    test('should store and retrieve weather data with time slot', () => {
      const weatherData = {
        temperature: 68,
        rain_probability: 15,
        windspeed: 8,
        weather_code: 0
      };

      weatherCache.set('2026-01-15', 'morning', weatherData);
      const retrieved = weatherCache.get('2026-01-15', 'morning');

      expect(retrieved).toEqual(weatherData);
    });

    test('should return null for non-existent cache entry', () => {
      const retrieved = weatherCache.get('2026-01-15', 'afternoon');
      expect(retrieved).toBeNull();
    });

    test('should store different data for different time slots on same date', () => {
      const morningData = {
        temperature: 50,
        rain_probability: 10,
        windspeed: 5,
        weather_code: 0
      };

      const afternoonData = {
        temperature: 70,
        rain_probability: 15,
        windspeed: 12,
        weather_code: 1
      };

      weatherCache.set('2026-01-15', 'morning', morningData);
      weatherCache.set('2026-01-15', 'afternoon', afternoonData);

      expect(weatherCache.get('2026-01-15', 'morning')).toEqual(morningData);
      expect(weatherCache.get('2026-01-15', 'afternoon')).toEqual(afternoonData);
    });
  });

  describe('expiration', () => {
    test('should return null for expired cache entries', () => {
      const weatherData = {
        temperature: 65,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 1
      };

      // Store data with a mocked old timestamp (5 hours ago - more than 4 hour limit)
      const key = weatherCache.getCacheKey('2026-01-15', 'morning');
      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000);
      const value = {
        data: weatherData,
        timestamp: fiveHoursAgo
      };
      weatherCache.cache.set(key, value);
      weatherCache.saveToLocalStorage(key, value);

      // Should return null because data is more than 4 hours old
      const retrieved = weatherCache.get('2026-01-15', 'morning');
      expect(retrieved).toBeNull();
    });

    test('should return data for non-expired cache entries', () => {
      const weatherData = {
        temperature: 65,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 1
      };

      // Store data with a recent timestamp (3 hours ago)
      const key = weatherCache.getCacheKey('2026-01-15', 'morning');
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      const value = {
        data: weatherData,
        timestamp: threeHoursAgo
      };
      weatherCache.cache.set(key, value);
      weatherCache.saveToLocalStorage(key, value);

      // Should return data because it's less than 4 hours old
      const retrieved = weatherCache.get('2026-01-15', 'morning');
      expect(retrieved).toEqual(weatherData);
    });
  });

  describe('clear', () => {
    test('should clear all cache entries', () => {
      weatherCache.set('2026-01-15', 'morning', { temperature: 50 });
      weatherCache.set('2026-01-15', 'afternoon', { temperature: 70 });
      weatherCache.set('2026-01-16', null, { temperature: 60 });

      weatherCache.clear();

      expect(weatherCache.get('2026-01-15', 'morning')).toBeNull();
      expect(weatherCache.get('2026-01-15', 'afternoon')).toBeNull();
      expect(weatherCache.get('2026-01-16')).toBeNull();
    });
  });

  describe('clearExpired', () => {
    test('should clear only expired entries', () => {
      const recentData = { temperature: 65 };
      const oldData = { temperature: 55 };

      // Store recent data (1 hour ago)
      const recentKey = weatherCache.getCacheKey('2026-01-15', 'morning');
      const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
      const recentValue = {
        data: recentData,
        timestamp: oneHourAgo
      };
      weatherCache.cache.set(recentKey, recentValue);
      weatherCache.saveToLocalStorage(recentKey, recentValue);

      // Store old data (5 hours ago - more than 4 hour limit)
      const oldKey = weatherCache.getCacheKey('2026-01-16', 'afternoon');
      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000);
      const oldValue = {
        data: oldData,
        timestamp: fiveHoursAgo
      };
      weatherCache.cache.set(oldKey, oldValue);
      weatherCache.saveToLocalStorage(oldKey, oldValue);

      weatherCache.clearExpired();

      // Recent data should still be there
      expect(weatherCache.get('2026-01-15', 'morning')).toEqual(recentData);

      // Old data should be gone
      expect(weatherCache.get('2026-01-16', 'afternoon')).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    test('should persist data to localStorage', () => {
      const weatherData = {
        temperature: 65,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 1
      };

      weatherCache.set('2026-01-15', 'morning', weatherData);

      // Check that data was saved to localStorage
      const localStorageKey = 'weather_cache_2026-01-15-morning';
      const storedData = JSON.parse(localStorage.getItem(localStorageKey));
      
      expect(storedData).toBeDefined();
      expect(storedData.data).toEqual(weatherData);
      expect(storedData.timestamp).toBeDefined();
    });

    test('should load data from localStorage on initialization', () => {
      const weatherData = {
        temperature: 70,
        rain_probability: 15,
        windspeed: 8,
        weather_code: 0
      };

      // Manually add data to mockStore
      const localStorageKey = 'weather_cache_2026-01-20-afternoon';
      const value = {
        data: weatherData,
        timestamp: Date.now() // Use current timestamp so it's not expired
      };
      mockStore[localStorageKey] = JSON.stringify(value);

      // Reload from localStorage (this should read from mockStore)
      weatherCache.loadFromLocalStorage();

      // Should be able to retrieve the data
      const retrieved = weatherCache.get('2026-01-20', 'afternoon');
      expect(retrieved).toEqual(weatherData);
    });

    test('should remove from localStorage when clearing', () => {
      weatherCache.set('2026-01-15', 'morning', { temperature: 65 });
      weatherCache.set('2026-01-16', 'afternoon', { temperature: 70 });

      // Verify data is in localStorage
      expect(localStorage.getItem('weather_cache_2026-01-15-morning')).toBeDefined();
      expect(localStorage.getItem('weather_cache_2026-01-16-afternoon')).toBeDefined();

      weatherCache.clear();

      // Verify data is removed from localStorage
      expect(localStorage.getItem('weather_cache_2026-01-15-morning')).toBeNull();
      expect(localStorage.getItem('weather_cache_2026-01-16-afternoon')).toBeNull();
    });
  });

  describe('isStale', () => {
    test('should return true for non-existent cache entry', () => {
      expect(weatherCache.isStale('2026-01-15', 'morning')).toBe(true);
    });

    test('should return true for expired cache entry', () => {
      const weatherData = { temperature: 65 };

      // Store data with old timestamp (5 hours ago)
      const key = weatherCache.getCacheKey('2026-01-15', 'morning');
      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000);
      const value = {
        data: weatherData,
        timestamp: fiveHoursAgo
      };
      weatherCache.cache.set(key, value);

      expect(weatherCache.isStale('2026-01-15', 'morning')).toBe(true);
    });

    test('should return false for fresh cache entry', () => {
      const weatherData = { temperature: 65 };

      // Store recent data (1 hour ago)
      weatherCache.set('2026-01-15', 'morning', weatherData);

      expect(weatherCache.isStale('2026-01-15', 'morning')).toBe(false);
    });
  });
});
