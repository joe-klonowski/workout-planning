/**
 * Weather cache utility to avoid unnecessary API calls
 * Stores weather data with timestamps in localStorage and only refetches if data is older than 4 hours
 */

import logger from './logger';

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const CACHE_KEY_PREFIX = 'weather_cache_';

class WeatherCache {
  constructor() {
    // Load cache from localStorage on initialization
    this.loadFromLocalStorage();
    
    // Set up periodic cleanup of expired entries (every 30 minutes)
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, 30 * 60 * 1000);
  }

  /**
   * Load cache from localStorage
   */
  loadFromLocalStorage() {
    this.cache = new Map();
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const cacheKey = key.substring(CACHE_KEY_PREFIX.length);
          const data = JSON.parse(localStorage.getItem(key));
          this.cache.set(cacheKey, data);
        }
      }
    } catch (error) {
      logger.error('Error loading weather cache from localStorage:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save a cache entry to localStorage
   */
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      logger.error('Error saving weather cache to localStorage:', error);
    }
  }

  /**
   * Remove a cache entry from localStorage
   */
  removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
    } catch (error) {
      logger.error('Error removing weather cache from localStorage:', error);
    }
  }

  /**
   * Generate a cache key from date and optional time slot
   * @param {string} date - Date string in YYYY-MM-DD format
   * @param {string} timeSlot - Optional time slot (morning, afternoon, evening)
   * @returns {string} Cache key
   */
  getCacheKey(date, timeSlot = null) {
    return timeSlot ? `${date}-${timeSlot}` : date;
  }

  /**
   * Get weather data from cache if available and not expired
   * @param {string} date - Date string in YYYY-MM-DD format
   * @param {string} timeSlot - Optional time slot (morning, afternoon, evening)
   * @returns {object|null} Weather data or null if not in cache or expired
   */
  get(date, timeSlot = null) {
    const key = this.getCacheKey(date, timeSlot);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is expired (older than 4 hours)
    if (age > CACHE_DURATION_MS) {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Store weather data in cache with current timestamp
   * @param {string} date - Date string in YYYY-MM-DD format
   * @param {string} timeSlot - Optional time slot (morning, afternoon, evening)
   * @param {object} data - Weather data to cache
   */
  set(date, timeSlot = null, data) {
    const key = this.getCacheKey(date, timeSlot);
    const value = {
      data,
      timestamp: Date.now()
    };
    this.cache.set(key, value);
    this.saveToLocalStorage(key, value);
  }

  /**
   * Clear all cached weather data
   */
  clear() {
    // Clear from memory
    for (const key of this.cache.keys()) {
      this.removeFromLocalStorage(key);
    }
    this.cache.clear();
  }

  /**
   * Clear expired entries from cache
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age > CACHE_DURATION_MS) {
        this.cache.delete(key);
        this.removeFromLocalStorage(key);
      }
    }
  }

  /**
   * Check if a specific cache entry is stale (needs refresh)
   * Returns true if the entry is more than 4 hours old
   * @param {string} date - Date string in YYYY-MM-DD format
   * @param {string} timeSlot - Optional time slot (morning, afternoon, evening)
   * @returns {boolean} True if cache entry is expired or missing
   */
  isStale(date, timeSlot = null) {
    const key = this.getCacheKey(date, timeSlot);
    const cached = this.cache.get(key);

    if (!cached) {
      return true; // No cache entry, so it's stale
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    return age > CACHE_DURATION_MS;
  }

  /**
   * Clean up interval on destruction (for testing)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export a singleton instance
export const weatherCache = new WeatherCache();
