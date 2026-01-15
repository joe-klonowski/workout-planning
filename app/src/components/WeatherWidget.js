import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { getWeatherInfo, isWeatherAvailable, getMaxWeatherForecastDate } from '../utils/weatherUtils';
import { weatherCache } from '../utils/weatherCache';
import '../styles/WeatherWidget.css';

/**
 * WeatherWidget component that displays weather information for a specific date
 * @param {string} date - ISO format date string (YYYY-MM-DD)
 * @param {string} workoutType - Type of workout (Swim, Bike, Run)
 * @param {boolean} isOpen - Whether to show the widget
 */
function WeatherWidget({ date, workoutType, isOpen }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Periodically check if weather data is stale and trigger refresh
  useEffect(() => {
    if (!isOpen || !date || !isWeatherAvailable(date)) {
      return;
    }

    // Check every 5 minutes if the weather data is stale
    const staleCheckInterval = setInterval(() => {
      if (weatherCache.isStale(date)) {
        // Trigger a refresh by updating the refreshTrigger state
        setRefreshTrigger(prev => prev + 1);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(staleCheckInterval);
  }, [date, isOpen]);

  useEffect(() => {
    if (!isOpen || !date) {
      setWeather(null);
      setError(null);
      return;
    }

    // Check if weather is available for this date before making API call
    if (!isWeatherAvailable(date)) {
      setWeather(null);
      setError(null); // Don't show as error - just don't display weather
      setLoading(false);
      return;
    }

    // Check cache first (no time slot for WeatherWidget - it uses daily forecast)
    const cachedWeather = weatherCache.get(date);
    if (cachedWeather) {
      setWeather(cachedWeather);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = API_ENDPOINTS.WEATHER_BY_DATE(date);
        const response = await apiCall(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch weather: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the weather data
        weatherCache.set(date, null, data);
        
        setWeather(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather data');
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [date, isOpen, refreshTrigger]);

  if (!isOpen) {
    return null;
  }

  // Don't show weather widget for dates beyond forecast range
  if (!isWeatherAvailable(date)) {
    return null;
  }

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-loading">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget weather-error">
        <div className="weather-error-message">{error}</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const weatherInfo = getWeatherInfo(weather.weather_code);

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <span className="weather-emoji">{weatherInfo.emoji}</span>
        <span className="weather-description">{weatherInfo.description}</span>
      </div>

      <div className="weather-details">
        <div className="weather-detail-row">
          <span className="weather-label">Temperature</span>
          <span className="weather-value">{Math.round(weather.temperature)}°F</span>
        </div>

        <div className="weather-detail-row">
          <span className="weather-label">Rain Probability</span>
          <span className="weather-value">{weather.rain_probability}%</span>
        </div>

        <div className="weather-detail-row">
          <span className="weather-label">Wind Speed</span>
          <span className="weather-value">{Math.round(weather.windspeed)} mph</span>
        </div>
      </div>
    </div>
  );
}

WeatherWidget.propTypes = {
  date: PropTypes.string,
  workoutType: PropTypes.string,
  isOpen: PropTypes.bool
};

WeatherWidget.defaultProps = {
  date: null,
  workoutType: null,
  isOpen: false
};

export default WeatherWidget;
