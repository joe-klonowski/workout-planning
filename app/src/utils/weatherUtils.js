/**
 * Weather utility functions for converting WMO codes and formatting weather data
 */

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

export default {
  getWeatherInfo
};
