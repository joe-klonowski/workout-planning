/**
 * Weather utility functions for converting WMO codes and formatting weather data
 */

// OpenMeteo API forecast range limits
// Hourly forecasts available for next 7 days
// Daily forecasts available for next 16 days
const MAX_HOURLY_FORECAST_DAYS = 7;
const MAX_DAILY_FORECAST_DAYS = 16;

// WMO Weather Code interpretation guide
// Reference: https://www.weatherapi.com/docs/weather_codes.php
const WMO_WEATHER_CODES = {
  0: { description: 'Clear sky', emoji: '☀️', badgeClass: 'weather-clear' },
  1: { description: 'Mainly clear', emoji: '⛅', badgeClass: 'weather-partly-cloudy' },
  2: { description: 'Partly cloudy', emoji: '🌤️', badgeClass: 'weather-partly-cloudy' },
  3: { description: 'Overcast', emoji: '☁️', badgeClass: 'weather-cloudy' },
  45: { description: 'Foggy', emoji: '🌫️', badgeClass: 'weather-fog' },
  48: { description: 'Depositing rime fog', emoji: '🌫️', badgeClass: 'weather-fog' },
  51: { description: 'Light drizzle', emoji: '🌧️', badgeClass: 'weather-rain' },
  53: { description: 'Moderate drizzle', emoji: '🌧️', badgeClass: 'weather-rain' },
  55: { description: 'Dense drizzle', emoji: '🌧️', badgeClass: 'weather-rain' },
  61: { description: 'Slight rain', emoji: '🌧️', badgeClass: 'weather-rain' },
  63: { description: 'Moderate rain', emoji: '🌧️', badgeClass: 'weather-rain' },
  65: { description: 'Heavy rain', emoji: '⛈️', badgeClass: 'weather-heavy-rain' },
  71: { description: 'Slight snow', emoji: '❄️', badgeClass: 'weather-snow' },
  73: { description: 'Moderate snow', emoji: '❄️', badgeClass: 'weather-snow' },
  75: { description: 'Heavy snow', emoji: '❄️', badgeClass: 'weather-snow' },
  77: { description: 'Snow grains', emoji: '❄️', badgeClass: 'weather-snow' },
  80: { description: 'Slight rain showers', emoji: '🌦️', badgeClass: 'weather-rain' },
  81: { description: 'Moderate rain showers', emoji: '🌦️', badgeClass: 'weather-rain' },
  82: { description: 'Violent rain showers', emoji: '⛈️', badgeClass: 'weather-heavy-rain' },
  85: { description: 'Slight snow showers', emoji: '🌨️', badgeClass: 'weather-snow' },
  86: { description: 'Heavy snow showers', emoji: '🌨️', badgeClass: 'weather-snow' },
  95: { description: 'Thunderstorm', emoji: '⛈️', badgeClass: 'weather-thunderstorm' },
  96: { description: 'Thunderstorm with slight hail', emoji: '⛈️', badgeClass: 'weather-thunderstorm' },
  99: { description: 'Thunderstorm with heavy hail', emoji: '⛈️', badgeClass: 'weather-thunderstorm' },
};

/**
 * Get weather description and emoji for a WMO weather code
 * @param {number} code - WMO weather code
 * @returns {Object} Object with description, emoji, and badgeClass
 */
export const getWeatherInfo = (code) => {
  return WMO_WEATHER_CODES[code] || { 
    description: 'Unknown weather', 
    emoji: '❓', 
    badgeClass: 'weather-unknown' 
  };
};

/**
 * Check if weather forecast is available for a given date
 * Daily forecasts are available for the next 16 days
 * @param {string} dateString - ISO format date string (YYYY-MM-DD)
 * @returns {boolean} True if forecast is available, false otherwise
 */
export const isWeatherAvailable = (dateString) => {
  if (!dateString) {
    return false;
  }
  
  try {
    const targetDate = new Date(dateString);
    const today = new Date();
    
    // Reset time portion to compare dates only
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Weather is available for today through the next 16 days
    return diffDays >= 0 && diffDays <= MAX_DAILY_FORECAST_DAYS;
  } catch (e) {
    return false;
  }
};

/**
 * Get maximum date for which weather forecast is available
 * @returns {string} ISO format date string (YYYY-MM-DD)
 */
export const getMaxWeatherForecastDate = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAILY_FORECAST_DAYS);
  return maxDate.toISOString().split('T')[0];
};

export default {
  getWeatherInfo,
  isWeatherAvailable,
  getMaxWeatherForecastDate
};
