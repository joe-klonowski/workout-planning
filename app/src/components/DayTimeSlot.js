import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { getWeatherInfo, isWeatherAvailable } from '../utils/weatherUtils';
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
  renderWorkoutBadge,
  getTimeOfDayLabel 
}) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch weather only for morning slot (once per day)
  useEffect(() => {
    if (timeSlot !== 'morning' && timeSlot !== 'afternoon' && timeSlot !== 'evening') {
      return; // Skip unscheduled
    }

    const dateStr = dayObj.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if weather is available for this date before making API call
    if (!isWeatherAvailable(dateStr)) {
      setWeather(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const fetchWeather = async () => {
      try {
        const url = API_ENDPOINTS.WEATHER_BY_DATE(dateStr);
        const response = await apiCall(url);
        
        if (!response.ok) {
          setError(true);
          setWeather(null);
          return;
        }
        
        const data = await response.json();
        setWeather(data);
        setError(false);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(true);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [dayObj.date, timeSlot]);

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
        <div className="time-slot-header">{getTimeOfDayLabel(timeSlot)}</div>
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
        {workouts.map((workout, idx) => renderWorkoutBadge(workout, idx))}
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
  renderWorkoutBadge: PropTypes.func.isRequired,
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
