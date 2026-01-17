"""
Weather API client for Open-Meteo weather service
Provides weather forecast for Chicago location
Supports both daily and hourly forecasts with time-of-day grouping
"""
import requests
from datetime import datetime, date, timedelta
from typing import Optional, Dict, List, Any
from collections import Counter
import logging

logger = logging.getLogger(__name__)

# Chicago location coordinates (user's workout location)
CHICAGO_LAT = 41.795604164195446
CHICAGO_LON = -87.57838836383468

# OpenMeteo API forecast range limits
MAX_HOURLY_FORECAST_DAYS = 7  # Hourly forecasts available for next 7 days
MAX_DAILY_FORECAST_DAYS = 16   # Daily forecasts available for next 16 days

# Time-of-day groupings (24-hour format)
MORNING_START = 5    # 5:00 AM
MORNING_END = 12     # 12:00 PM (noon)
AFTERNOON_START = 12 # 12:00 PM
AFTERNOON_END = 17   # 5:00 PM
EVENING_START = 17   # 5:00 PM
EVENING_END = 21     # 9:00 PM


class WeatherClient:
    """
    Client for fetching weather data from Open-Meteo API
    No API key required - free public API
    """
    
    BASE_URL = 'https://api.open-meteo.com/v1/forecast'
    
    def __init__(self, lat: float = CHICAGO_LAT, lon: float = CHICAGO_LON):
        """
        Initialize weather client with location coordinates
        
        Args:
            lat: Latitude of location (default: Chicago)
            lon: Longitude of location (default: Chicago)
        """
        self.lat = lat
        self.lon = lon
        self.timeout = 10  # seconds
    
    def get_forecast(self, start_date: Optional[date] = None, 
                    end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get weather forecast for date range
        
        Args:
            start_date: Start date for forecast (default: today)
            end_date: End date for forecast (default: 7 days from start)
        
        Returns:
            Dictionary with forecast data including:
            - dates: List of dates
            - temperatures: List of max apparent ("feels like") temperatures in Fahrenheit
            - rain_probability: List of probability of rain (0-100)
            - windspeed: List of wind speeds in mph
            - weather_codes: List of WMO weather codes
        
        Raises:
            WeatherAPIError: If API request fails or date is beyond forecast range
        """
        if start_date is None:
            start_date = date.today()
        if end_date is None:
            end_date = start_date + timedelta(days=7)
        
        # Validate date is within forecast range
        today = date.today()
        max_date = today + timedelta(days=MAX_DAILY_FORECAST_DAYS)
        
        if start_date > max_date:
            raise WeatherAPIError(
                f"Forecast date {start_date} is beyond the {MAX_DAILY_FORECAST_DAYS}-day forecast range. "
                f"Weather forecasts are only available through {max_date.isoformat()}."
            )
        
        if end_date > max_date:
            raise WeatherAPIError(
                f"Forecast end date {end_date} is beyond the {MAX_DAILY_FORECAST_DAYS}-day forecast range. "
                f"Weather forecasts are only available through {max_date.isoformat()}."
            )
        
        try:
            params = {
                'latitude': self.lat,
                'longitude': self.lon,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'daily': 'apparent_temperature_max,precipitation_probability_max,windspeed_10m_max,weather_code',
                'temperature_unit': 'fahrenheit',
                'wind_speed_unit': 'mph',
                'timezone': 'America/Chicago'
            }
            
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Parse daily forecast data (use apparent/"feels like" temperatures)
            daily = data.get('daily', {})
            return {
                'latitude': data['latitude'],
                'longitude': data['longitude'],
                'timezone': data['timezone'],
                'dates': daily.get('time', []),
                'temperatures': daily.get('apparent_temperature_max', []),
                'rain_probability': daily.get('precipitation_probability_max', []),
                'windspeed': daily.get('windspeed_10m_max', []),
                'weather_codes': daily.get('weather_code', [])
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API request failed: {e}")
            raise WeatherAPIError(f"Failed to fetch weather data: {e}")
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            raise WeatherAPIError(f"Failed to fetch weather data: {e}")
    
    def get_daily_forecast(self, forecast_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get weather forecast for a single day
        
        Args:
            forecast_date: Date to forecast (default: today)
        
        Returns:
            Dictionary with weather data for the day:
            - date: The date
            - temperature: Max temperature in Fahrenheit
            - rain_probability: Probability of rain (0-100)
            - windspeed: Max wind speed in mph
            - weather_code: WMO weather code
            - description: Human-readable weather description
        
        Raises:
            WeatherAPIError: If API request fails, date not found, or date is beyond forecast range
        """
        if forecast_date is None:
            forecast_date = date.today()
        
        # Validate date is within forecast range
        today = date.today()
        max_date = today + timedelta(days=MAX_DAILY_FORECAST_DAYS)
        
        if forecast_date > max_date:
            raise WeatherAPIError(
                f"Forecast date {forecast_date} is beyond the {MAX_DAILY_FORECAST_DAYS}-day forecast range. "
                f"Weather forecasts are only available through {max_date.isoformat()}."
            )
        
        forecast = self.get_forecast(forecast_date, forecast_date)
        
        if not forecast['dates']:
            raise WeatherAPIError(f"No forecast data available for {forecast_date}")
        
        return {
            'date': forecast['dates'][0],
            'temperature': forecast['temperatures'][0],
            'rain_probability': forecast['rain_probability'][0],
            'windspeed': forecast['windspeed'][0],
            'weather_code': forecast['weather_codes'][0],
            'description': _get_weather_description(forecast['weather_codes'][0])
        }
    
    def get_hourly_forecast(self, start_date: Optional[date] = None,
                           end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get hourly weather forecast for date range
        
        Args:
            start_date: Start date for forecast (default: today)
            end_date: End date for forecast (default: 7 days from start)
        
        Returns:
            Dictionary with hourly forecast data:
            - times: List of ISO format datetime strings
            - temperatures: List of apparent ("feels like") temperatures in Fahrenheit
            - rain_probability: List of probability of rain (0-100)
            - windspeed: List of wind speeds in mph
            - weather_codes: List of WMO weather codes
        
        Raises:
            WeatherAPIError: If API request fails or date is beyond forecast range
        """
        if start_date is None:
            start_date = date.today()
        if end_date is None:
            end_date = start_date + timedelta(days=7)
        
        # Validate date is within hourly forecast range
        today = date.today()
        max_date = today + timedelta(days=MAX_HOURLY_FORECAST_DAYS)
        
        if start_date > max_date:
            raise WeatherAPIError(
                f"Forecast date {start_date} is beyond the {MAX_HOURLY_FORECAST_DAYS}-day hourly forecast range. "
                f"Hourly weather forecasts are only available through {max_date.isoformat()}."
            )
        
        if end_date > max_date:
            raise WeatherAPIError(
                f"Forecast end date {end_date} is beyond the {MAX_HOURLY_FORECAST_DAYS}-day hourly forecast range. "
                f"Hourly weather forecasts are only available through {max_date.isoformat()}."
            )
        
        try:
            params = {
                'latitude': self.lat,
                'longitude': self.lon,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'hourly': 'apparent_temperature,precipitation_probability,windspeed_10m,weather_code',
                'temperature_unit': 'fahrenheit',
                'wind_speed_unit': 'mph',
                'timezone': 'America/Chicago'
            }
            
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Parse hourly forecast data (use apparent/"feels like" temperatures)
            hourly = data.get('hourly', {})
            return {
                'latitude': data['latitude'],
                'longitude': data['longitude'],
                'timezone': data['timezone'],
                'times': hourly.get('time', []),
                'temperatures': hourly.get('apparent_temperature', []),
                'rain_probability': hourly.get('precipitation_probability', []),
                'windspeed': hourly.get('windspeed_10m', []),
                'weather_codes': hourly.get('weather_code', [])
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API request failed: {e}")
            raise WeatherAPIError(f"Failed to fetch weather data: {e}")
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            raise WeatherAPIError(f"Failed to fetch weather data: {e}")
    
    def get_weather_by_time_of_day(self, forecast_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get weather forecast grouped by time of day (morning, afternoon, evening)
        
        Args:
            forecast_date: Date to forecast (default: today)
        
        Returns:
            Dictionary with weather grouped by time of day:
            {
                "date": "2026-01-10",
                "morning": {
                    "temperature": 32.5,
                    "rain_probability": 20,
                    "windspeed": 10.5,
                    "weather_code": 2,
                    "description": "Partly cloudy"
                },
                "afternoon": {...},
                "evening": {...}
            }
        
        Raises:
            WeatherAPIError: If API request fails, date not found, or date is beyond forecast range
        """
        if forecast_date is None:
            forecast_date = date.today()
        
        # Validate date is within hourly forecast range (required for time-of-day grouping)
        today = date.today()
        max_date = today + timedelta(days=MAX_HOURLY_FORECAST_DAYS)
        
        if forecast_date > max_date:
            raise WeatherAPIError(
                f"Forecast date {forecast_date} is beyond the {MAX_HOURLY_FORECAST_DAYS}-day hourly forecast range. "
                f"Time-of-day weather forecasts are only available through {max_date.isoformat()}."
            )
        
        hourly = self.get_hourly_forecast(forecast_date, forecast_date)
        
        if not hourly['times']:
            raise WeatherAPIError(f"No forecast data available for {forecast_date}")
        
        # Group hourly data by time of day
        morning_temps = []
        morning_rain = []
        morning_wind = []
        morning_codes = []
        
        afternoon_temps = []
        afternoon_rain = []
        afternoon_wind = []
        afternoon_codes = []
        
        evening_temps = []
        evening_rain = []
        evening_wind = []
        evening_codes = []
        
        for i, time_str in enumerate(hourly['times']):
            # Parse hour from ISO datetime string
            hour = int(time_str.split('T')[1].split(':')[0])
            
            temp = hourly['temperatures'][i]
            rain = hourly['rain_probability'][i]
            wind = hourly['windspeed'][i]
            code = hourly['weather_codes'][i]
            
            # Group by time of day
            if MORNING_START <= hour < MORNING_END:
                morning_temps.append(temp)
                morning_rain.append(rain)
                morning_wind.append(wind)
                morning_codes.append(code)
            elif AFTERNOON_START <= hour < AFTERNOON_END:
                afternoon_temps.append(temp)
                afternoon_rain.append(rain)
                afternoon_wind.append(wind)
                afternoon_codes.append(code)
            elif EVENING_START <= hour < EVENING_END:
                evening_temps.append(temp)
                evening_rain.append(rain)
                evening_wind.append(wind)
                evening_codes.append(code)
        
        return {
            'date': forecast_date.isoformat(),
            'morning': self._format_time_period(morning_temps, morning_rain, morning_wind, morning_codes),
            'afternoon': self._format_time_period(afternoon_temps, afternoon_rain, afternoon_wind, afternoon_codes),
            'evening': self._format_time_period(evening_temps, evening_rain, evening_wind, evening_codes)
        }
    
    def _format_time_period(self, temps: List[float], rain: List[int], 
                           wind: List[float], codes: List[int]) -> Dict[str, Any]:
        """Format hourly data into a time period summary"""
        if not temps:
            return {
                'temperature': None,
                'rain_probability': None,
                'windspeed': None,
                'weather_code': None,
                'description': 'No data'
            }
        
        def average(lst):
            return sum(lst) / len(lst) if lst else None
        
        def max_val(lst):
            return max(lst) if lst else None
        
        def get_dominant_code(codes):
            if not codes:
                return None
            return Counter(codes).most_common(1)[0][0]
        
        dominant_code = get_dominant_code(codes)
        
        return {
            'temperature': round(average(temps), 1),
            'rain_probability': max_val(rain),  # Use max probability
            'windspeed': round(average(wind), 1),
            'weather_code': dominant_code,
            'description': _get_weather_description(dominant_code) if dominant_code else 'Unknown'
        }


def _get_weather_description(code: int) -> str:
    """
    Convert WMO weather code to human-readable description
    
    Reference: https://www.weatherapi.com/docs/weather_codes.asp
    """
    descriptions = {
        # Clear
        0: 'Clear sky',
        1: 'Mostly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        
        # Drizzle
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        
        # Rain
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        
        # Snow
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        
        # Rain + Snow
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        
        # Thunderstorm
        80: 'Thunderstorm',
        81: 'Thunderstorm with hail',
    }
    
    return descriptions.get(code, f'Unknown (code {code})')


class WeatherAPIError(Exception):
    """Exception raised when weather API request fails"""
    pass
