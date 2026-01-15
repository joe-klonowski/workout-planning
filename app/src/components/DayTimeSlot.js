import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { getWeatherInfo, isWeatherAvailable, isHourlyWeatherAvailable } from '../utils/weatherUtils';
import { weatherCache } from '../utils/weatherCache';
import WorkoutBadge from './WorkoutBadge';
import '../styles/DayTimeSlot.css';

/**
 * DayTimeSlot component displays a time slot (morning/afternoon/evening) 
 * with weather information and workouts for a specific day
 */
function DayTimeSlot({ 
  dayObj, 
  timeSlot, 
  workouts = [], 
  triClubEvents = [], 
  draggedWorkout,
  dragOverDate,
  dragOverTimeSlot,
  onDragOver,
  onDragLeave,
  onDrop,
  onWorkoutDragStart,
  onWorkoutDragEnd,
  onWorkoutClick,
  onWorkoutSelectionToggle,
  getTimeOfDayLabel 
}) {
  const [weather, setWeather] = useState(null);
  const [isDailyForecast, setIsDailyForecast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Convert date to stable string for dependency tracking
  const dateStr = dayObj.date.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Periodically check if weather data is stale and trigger refresh
  useEffect(() => {
    if (timeSlot !== 'morning' && timeSlot !== 'afternoon' && timeSlot !== 'evening') {
      return;
    }
    
    if (!isWeatherAvailable(dateStr)) {
      return;
    }

    // Check every 5 minutes if the weather data is stale
    const staleCheckInterval = setInterval(() => {
      if (weatherCache.isStale(dateStr, timeSlot)) {
        // Trigger a refresh by updating the refreshTrigger state
        setRefreshTrigger(prev => prev + 1);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(staleCheckInterval);
  }, [dateStr, timeSlot]);

  // Fetch weather - use hourly (time-of-day) for days 0-7, daily for days 8-16
  useEffect(() => {
    if (timeSlot !== 'morning' && timeSlot !== 'afternoon' && timeSlot !== 'evening') {
      return; // Skip unscheduled
    }
    
    // Check if weather is available for this date before making API call
    if (!isWeatherAvailable(dateStr)) {
      setWeather(null);
      setIsDailyForecast(false);
      setError(false);
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedWeather = weatherCache.get(dateStr, timeSlot);
    if (cachedWeather) {
      setWeather(cachedWeather);
      setError(false);
      setLoading(false);
      
      // Determine if this is daily forecast based on whether hourly forecast is available
      const hasHourlyForecast = isHourlyWeatherAvailable(dateStr);
      setIsDailyForecast(!hasHourlyForecast);
      return;
    }

    // Check if hourly forecast is available
    const hasHourlyForecast = isHourlyWeatherAvailable(dateStr);
    setIsDailyForecast(!hasHourlyForecast);

    // For daily forecasts (days 7-16), only show weather in morning slot
    if (!hasHourlyForecast && timeSlot !== 'morning') {
      setWeather(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const fetchWeather = async () => {
      try {
        let weatherData;
        
        if (hasHourlyForecast) {
          // Use time-of-day endpoint for days 0-7
          const url = API_ENDPOINTS.WEATHER_BY_TIME_OF_DAY(dateStr);
          const response = await apiCall(url);
          
          if (!response.ok) {
            setError(true);
            setWeather(null);
            setIsDailyForecast(false);
            return;
          }
          
          const data = await response.json();
          weatherData = data[timeSlot];
        } else {
          // Use daily endpoint for days 8-16
          const url = API_ENDPOINTS.WEATHER_BY_DATE(dateStr);
          const response = await apiCall(url);
          
          if (!response.ok) {
            setError(true);
            setWeather(null);
            return;
          }
          
          weatherData = await response.json();
        }
        
        // Cache the weather data
        weatherCache.set(dateStr, timeSlot, weatherData);
        
        setWeather(weatherData);
        setError(false);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(true);
        setWeather(null);
        setIsDailyForecast(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [dateStr, timeSlot, refreshTrigger]);

  const isBeingDraggedOver = draggedWorkout && 
    dragOverDate === dayObj.date.toISOString() && 
    dragOverTimeSlot === timeSlot;
  
  const hasContent = workouts.length > 0 || triClubEvents.length > 0;
  
  // Only show weather for scheduled time slots, not unscheduled
  const shouldShowWeather = (timeSlot === 'morning' || timeSlot === 'afternoon' || timeSlot === 'evening') && weather;
  const weatherInfo = shouldShowWeather ? getWeatherInfo(weather.weather_code) : null;

  return (
    <div
      className={`time-slot ${timeSlot} ${isBeingDraggedOver ? 'drag-over' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header with time label and weather */}
      <div className="time-slot-header-row">
        <div className="time-slot-header">
          {getTimeOfDayLabel(timeSlot)}
          {isDailyForecast && shouldShowWeather && (
            <span className="daily-forecast-indicator" title="Full-day forecast">📅</span>
          )}
        </div>
        {shouldShowWeather && (
          <div className="time-slot-weather-mini">
            <span className="weather-emoji-mini">{weatherInfo.emoji}</span>
            <span className="weather-temp-mini">{Math.round(weather.temperature)}°F</span>
          </div>
        )}
      </div>

      {/* Full weather details when not loading or on error */}
      {shouldShowWeather && !loading && !error && (
        <div className="time-slot-weather-details">
          <div className="weather-detail">
            <span className="label">Rain:</span>
            <span className="value">{weather.rain_probability}%</span>
          </div>
          <div className="weather-detail">
            <span className="label">Wind:</span>
            <span className="value">{Math.round(weather.windspeed)} mph</span>
          </div>
        </div>
      )}

      {/* Tri-club events */}
      {triClubEvents.length > 0 && (
        <div className="tri-club-events">
          {triClubEvents.map((event, idx) => (
            <div key={idx} className="tri-club-event">
              {event.formattedTime} tri club {event.activity.toLowerCase()}
            </div>
          ))}
        </div>
      )}

      {/* Workouts */}
      <div className="time-slot-workouts">
        {workouts.map((workout, idx) => (
          <WorkoutBadge
            key={idx}
            workout={workout}
            onDragStart={onWorkoutDragStart}
            onDragEnd={onWorkoutDragEnd}
            onWorkoutClick={() => onWorkoutClick(workout)}
            onSelectionToggle={onWorkoutSelectionToggle}
            draggedWorkoutId={draggedWorkout?.id}
          />
        ))}
      </div>

      {/* Placeholder for empty unscheduled slots */}
      {draggedWorkout && !hasContent && (
        <div className="time-slot-placeholder">
          {getTimeOfDayLabel(timeSlot)}
        </div>
      )}
    </div>
  );
}

DayTimeSlot.propTypes = {
  dayObj: PropTypes.shape({
    date: PropTypes.object.isRequired,
  }).isRequired,
  timeSlot: PropTypes.string.isRequired,
  workouts: PropTypes.array,
  triClubEvents: PropTypes.array,
  draggedWorkout: PropTypes.object,
  dragOverDate: PropTypes.string,
  dragOverTimeSlot: PropTypes.string,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onWorkoutDragStart: PropTypes.func.isRequired,
  onWorkoutDragEnd: PropTypes.func.isRequired,
  onWorkoutClick: PropTypes.func.isRequired,
  onWorkoutSelectionToggle: PropTypes.func,
  getTimeOfDayLabel: PropTypes.func.isRequired,
};

DayTimeSlot.defaultProps = {
  workouts: [],
  triClubEvents: [],
  draggedWorkout: null,
  dragOverDate: null,
  dragOverTimeSlot: null,
};

export default DayTimeSlot;
