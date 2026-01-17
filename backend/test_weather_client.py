"""
Tests for weather_client.py
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from weather_client import WeatherClient, WeatherAPIError, _get_weather_description


@pytest.fixture
def weather_client():
    """Create a weather client instance for testing"""
    return WeatherClient()


class TestWeatherClient:
    """Test cases for WeatherClient class"""
    
    def test_init_default_coordinates(self):
        """Test initialization with default Chicago coordinates"""
        client = WeatherClient()
        assert client.lat == 41.795604164195446
        assert client.lon == -87.57838836383468
        assert client.timeout == 10
    
    def test_init_custom_coordinates(self):
        """Test initialization with custom coordinates"""
        client = WeatherClient(lat=40.0, lon=-88.0)
        assert client.lat == 40.0
        assert client.lon == -88.0
    
    @patch('weather_client.requests.get')
    def test_get_forecast_success(self, mock_get):
        """Test successful forecast retrieval"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10', '2026-01-11'],
                'apparent_temperature_max': [32.5, 35.2],
                'precipitation_probability_max': [20, 60],
                'windspeed_10m_max': [10.5, 15.3],
                'weather_code': [2, 51]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        forecast = client.get_forecast(
            start_date=date(2026, 1, 10),
            end_date=date(2026, 1, 11)
        )
        
        assert forecast['latitude'] == 41.8
        assert forecast['longitude'] == -87.6
        assert len(forecast['dates']) == 2
        assert forecast['temperatures'] == [32.5, 35.2]
        assert forecast['rain_probability'] == [20, 60]
        assert forecast['windspeed'] == [10.5, 15.3]
        assert forecast['weather_codes'] == [2, 51]
        
        # Verify API was called with correct parameters
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert call_args[0][0] == 'https://api.open-meteo.com/v1/forecast'
        assert call_args[1]['params']['latitude'] == 41.795604164195446
        assert call_args[1]['params']['longitude'] == -87.57838836383468
    
    @patch('weather_client.requests.get')
    def test_get_forecast_default_dates(self, mock_get):
        """Test forecast with default date range (today + 7 days)"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': [date.today().isoformat()],
                'apparent_temperature_max': [32.0],
                'precipitation_probability_max': [0],
                'windspeed_10m_max': [5.0],
                'weather_code': [0]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        forecast = client.get_forecast()
        
        # Verify dates were set correctly
        call_args = mock_get.call_args
        params = call_args[1]['params']
        assert params['start_date'] == date.today().isoformat()
        assert params['end_date'] == (date.today() + timedelta(days=7)).isoformat()
    
    @patch('weather_client.requests.get')
    def test_get_forecast_api_error(self, mock_get):
        """Test handling of API errors"""
        mock_get.side_effect = Exception("Connection timeout")
        
        client = WeatherClient()
        with pytest.raises(WeatherAPIError):
            client.get_forecast()
    
    @patch('weather_client.requests.get')
    def test_get_forecast_http_error(self, mock_get):
        """Test handling of HTTP errors"""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("404 Not Found")
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        with pytest.raises(WeatherAPIError):
            client.get_forecast()
    
    @patch('weather_client.requests.get')
    def test_get_daily_forecast_success(self, mock_get):
        """Test retrieving single day forecast"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10'],
                'apparent_temperature_max': [35.5],
                'precipitation_probability_max': [40],
                'windspeed_10m_max': [12.3],
                'weather_code': [61]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        daily = client.get_daily_forecast(date(2026, 1, 10))
        
        assert daily['date'] == '2026-01-10'
        assert daily['temperature'] == 35.5
        assert daily['rain_probability'] == 40
        assert daily['windspeed'] == 12.3
        assert daily['weather_code'] == 61
        assert 'rain' in daily['description'].lower()
    
    @patch('weather_client.requests.get')
    def test_get_daily_forecast_default_date(self, mock_get):
        """Test daily forecast uses today's date by default"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': [date.today().isoformat()],
                'apparent_temperature_max': [32.0],
                'precipitation_probability_max': [0],
                'windspeed_10m_max': [5.0],
                'weather_code': [0]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        daily = client.get_daily_forecast()
        
        # Verify dates match today
        call_args = mock_get.call_args
        params = call_args[1]['params']
        assert params['start_date'] == date.today().isoformat()
        assert params['end_date'] == date.today().isoformat()
    
    @patch('weather_client.requests.get')
    def test_get_daily_forecast_no_data(self, mock_get):
        """Test error when no forecast data available"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': [],
                'apparent_temperature_max': [],
                'precipitation_probability_max': [],
                'windspeed_10m_max': [],
                'weather_code': []
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        with pytest.raises(WeatherAPIError):
            client.get_daily_forecast(date(2026, 1, 10))
    
    def test_api_parameters_format(self, weather_client):
        """Test that API is configured with correct parameters"""
        with patch('weather_client.requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                'latitude': 41.8,
                'longitude': -87.6,
                'timezone': 'America/Chicago',
                'daily': {
                    'time': [],
                    'apparent_temperature_max': [],
                    'precipitation_probability_max': [],
                    'windspeed_10m_max': [],
                    'weather_code': []
                }
            }
            mock_get.return_value = mock_response
            
            try:
                weather_client.get_forecast(date(2026, 1, 10), date(2026, 1, 10))
            except WeatherAPIError:
                pass  # Expected because of empty data
            
            # Check parameters
            call_args = mock_get.call_args
            params = call_args[1]['params']
            
            assert params['temperature_unit'] == 'fahrenheit'
            assert params['wind_speed_unit'] == 'mph'
            assert params['timezone'] == 'America/Chicago'
            assert 'apparent_temperature_max' in params['daily']
            assert 'precipitation_probability_max' in params['daily']
            assert 'windspeed_10m_max' in params['daily']
            assert 'weather_code' in params['daily']


class TestWeatherDescriptions:
    """Test weather code to description mapping"""
    
    def test_clear_sky_codes(self):
        """Test clear weather codes"""
        assert 'clear' in _get_weather_description(0).lower()
        assert 'clear' in _get_weather_description(1).lower()
        assert 'cloudy' in _get_weather_description(2).lower()
        assert 'overcast' in _get_weather_description(3).lower()
    
    def test_rain_codes(self):
        """Test rain weather codes"""
        assert 'rain' in _get_weather_description(61).lower()
        assert 'rain' in _get_weather_description(63).lower()
        assert 'rain' in _get_weather_description(65).lower()
    
    def test_snow_codes(self):
        """Test snow weather codes"""
        assert 'snow' in _get_weather_description(71).lower()
        assert 'snow' in _get_weather_description(73).lower()
        assert 'snow' in _get_weather_description(75).lower()
    
    def test_fog_codes(self):
        """Test fog weather codes"""
        assert 'fog' in _get_weather_description(45).lower()
    
    def test_unknown_code(self):
        """Test unknown weather codes"""
        result = _get_weather_description(999)
        assert 'unknown' in result.lower()
        assert '999' in result

class TestHourlyForecast:
    """Test cases for hourly forecast functionality"""
    
    @patch('weather_client.requests.get')
    def test_get_hourly_forecast_success(self, mock_get):
        """Test successful hourly forecast retrieval"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [
                    '2026-01-10T05:00',
                    '2026-01-10T06:00',
                    '2026-01-10T12:00',
                    '2026-01-10T17:00',
                    '2026-01-10T21:00'
                ],
                'apparent_temperature': [28.5, 30.1, 35.2, 32.0, 25.3],
                'precipitation_probability': [10, 15, 20, 30, 40],
                'windspeed_10m': [8.5, 9.2, 12.5, 14.3, 10.1],
                'weather_code': [0, 0, 2, 51, 1]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        result = client.get_hourly_forecast(date(2026, 1, 10), date(2026, 1, 10))
        
        assert result['latitude'] == 41.8
        assert result['longitude'] == -87.6
        assert result['timezone'] == 'America/Chicago'
        assert len(result['times']) == 5
        assert result['temperatures'] == [28.5, 30.1, 35.2, 32.0, 25.3]
        assert result['rain_probability'] == [10, 15, 20, 30, 40]
    
    @patch('weather_client.requests.get')
    def test_get_hourly_forecast_default_dates(self, mock_get):
        """Test hourly forecast with default dates (today to 7 days)"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [],
                'apparent_temperature': [],
                'precipitation_probability': [],
                'windspeed_10m': [],
                'weather_code': []
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        client.get_hourly_forecast()
        
        # Verify API was called with correct parameters
        call_args = mock_get.call_args
        params = call_args.kwargs['params']
        assert 'start_date' in params
        assert 'end_date' in params
        assert 'hourly' in params
        assert params['hourly'] == 'apparent_temperature,precipitation_probability,windspeed_10m,weather_code'


class TestTimeOfDayForecast:
    """Test cases for time-of-day grouped forecast functionality"""
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_success(self, mock_get):
        """Test successful time-of-day forecast grouping"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [
                    '2026-01-10T05:00',  # Morning (5am)
                    '2026-01-10T08:00',  # Morning (8am)
                    '2026-01-10T12:00',  # Afternoon (12pm)
                    '2026-01-10T14:00',  # Afternoon (2pm)
                    '2026-01-10T17:00',  # Evening (5pm)
                    '2026-01-10T19:00'   # Evening (7pm)
                ],
                'apparent_temperature': [28.0, 32.0, 36.0, 35.0, 30.0, 25.0],
                'precipitation_probability': [10, 10, 20, 20, 30, 40],
                'windspeed_10m': [8.0, 10.0, 12.0, 13.0, 14.0, 10.0],
                'weather_code': [0, 0, 2, 2, 1, 1]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        result = client.get_weather_by_time_of_day(date(2026, 1, 10))
        
        assert result['date'] == '2026-01-10'
        
        # Check morning data (5am-12pm: temps 28, 32; rain 10, 10; wind 8, 10; codes 0, 0)
        assert result['morning']['temperature'] == 30.0  # Average of 28 and 32
        assert result['morning']['rain_probability'] == 10  # Max
        assert result['morning']['windspeed'] == 9.0  # Average of 8 and 10
        assert result['morning']['weather_code'] == 0  # Most common code
        
        # Check afternoon data (12pm-5pm: temps 36, 35; rain 20, 20; wind 12, 13; codes 2, 2)
        assert result['afternoon']['temperature'] == 35.5  # Average of 36 and 35
        assert result['afternoon']['rain_probability'] == 20  # Max
        assert result['afternoon']['windspeed'] == 12.5  # Average of 12 and 13
        assert result['afternoon']['weather_code'] == 2  # Most common code
        
        # Check evening data (5pm-9pm: temps 30, 25; rain 30, 40; wind 14, 10; codes 1, 1)
        assert result['evening']['temperature'] == 27.5  # Average of 30 and 25
        assert result['evening']['rain_probability'] == 40  # Max
        assert result['evening']['windspeed'] == 12.0  # Average of 14 and 10
        assert result['evening']['weather_code'] == 1  # Most common code
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_partial_data(self, mock_get):
        """Test time-of-day forecast with missing time periods"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [
                    '2026-01-10T08:00',  # Morning only
                    '2026-01-10T10:00'   # Morning only
                ],
                'apparent_temperature': [30.0, 34.0],
                'precipitation_probability': [15, 15],
                'windspeed_10m': [9.0, 10.0],
                'weather_code': [1, 1]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        result = client.get_weather_by_time_of_day(date(2026, 1, 10))
        
        # Morning should have data
        assert result['morning']['temperature'] == 32.0  # Average of 30 and 34
        assert result['morning']['weather_code'] == 1
        
        # Afternoon and evening should be None
        assert result['afternoon']['temperature'] is None
        assert result['afternoon']['description'] == 'No data'
        assert result['evening']['temperature'] is None
        assert result['evening']['description'] == 'No data'
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_no_data(self, mock_get):
        """Test time-of-day forecast with no data"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [],
                'apparent_temperature': [],
                'precipitation_probability': [],
                'windspeed_10m': [],
                'weather_code': []
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        with pytest.raises(WeatherAPIError):
            client.get_weather_by_time_of_day(date(2026, 1, 10))
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_api_error(self, mock_get):
        """Test time-of-day forecast API error handling"""
        mock_get.side_effect = Exception("API Error")
        
        client = WeatherClient()
        with pytest.raises(WeatherAPIError):
            client.get_weather_by_time_of_day(date(2026, 1, 10))
    
    def test_get_forecast_date_too_far_in_future(self):
        """Test that forecast raises error for dates beyond 16-day forecast range"""
        client = WeatherClient()
        
        # Try to get forecast for 20 days from now (beyond 16-day limit)
        future_date = date.today() + timedelta(days=20)
        
        with pytest.raises(WeatherAPIError) as exc_info:
            client.get_forecast(start_date=future_date)
        
        assert "beyond the 16-day forecast range" in str(exc_info.value)
        assert future_date.isoformat() in str(exc_info.value)
    
    def test_get_forecast_end_date_too_far_in_future(self):
        """Test that forecast raises error when end date is beyond 16-day forecast range"""
        client = WeatherClient()
        
        # Start date is within range, but end date is not
        start_date = date.today() + timedelta(days=10)
        end_date = date.today() + timedelta(days=20)
        
        with pytest.raises(WeatherAPIError) as exc_info:
            client.get_forecast(start_date=start_date, end_date=end_date)
        
        assert "beyond the 16-day forecast range" in str(exc_info.value)
    
    def test_get_daily_forecast_date_too_far_in_future(self):
        """Test that daily forecast raises error for dates beyond 16-day forecast range"""
        client = WeatherClient()
        
        # Try to get forecast for 20 days from now (beyond 16-day limit)
        future_date = date.today() + timedelta(days=20)
        
        with pytest.raises(WeatherAPIError) as exc_info:
            client.get_daily_forecast(forecast_date=future_date)
        
        assert "beyond the 16-day forecast range" in str(exc_info.value)
        assert future_date.isoformat() in str(exc_info.value)
    
    def test_get_hourly_forecast_date_too_far_in_future(self):
        """Test that hourly forecast raises error for dates beyond 7-day forecast range"""
        client = WeatherClient()
        
        # Try to get hourly forecast for 10 days from now (beyond 7-day limit)
        future_date = date.today() + timedelta(days=10)
        
        with pytest.raises(WeatherAPIError) as exc_info:
            client.get_hourly_forecast(start_date=future_date)
        
        assert "beyond the 7-day hourly forecast range" in str(exc_info.value)
        assert future_date.isoformat() in str(exc_info.value)
    
    def test_get_weather_by_time_of_day_date_too_far_in_future(self):
        """Test that time-of-day forecast raises error for dates beyond 7-day forecast range"""
        client = WeatherClient()
        
        # Try to get time-of-day forecast for 10 days from now (beyond 7-day hourly limit)
        future_date = date.today() + timedelta(days=10)
        
        with pytest.raises(WeatherAPIError) as exc_info:
            client.get_weather_by_time_of_day(forecast_date=future_date)
        
        assert "beyond the 7-day hourly forecast range" in str(exc_info.value)
        assert future_date.isoformat() in str(exc_info.value)
    
    @patch('weather_client.requests.get')
    def test_get_forecast_date_within_range(self, mock_get):
        """Test that forecast succeeds for dates within 16-day forecast range"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-20'],
                'apparent_temperature_max': [35.0],
                'precipitation_probability_max': [10],
                'windspeed_10m_max': [8.0],
                'weather_code': [1]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        
        # Try to get forecast for 10 days from now (within 16-day limit)
        future_date = date.today() + timedelta(days=10)
        
        # Should succeed without raising an error
        forecast = client.get_forecast(start_date=future_date, end_date=future_date)
        assert forecast is not None
    
    @patch('weather_client.requests.get')
    def test_get_hourly_forecast_date_within_range(self, mock_get):
        """Test that hourly forecast succeeds for dates within 7-day forecast range"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': ['2026-01-15T12:00'],
                'apparent_temperature': [35.0],
                'precipitation_probability': [10],
                'windspeed_10m': [8.0],
                'weather_code': [1]
            }
        }
        mock_get.return_value = mock_response
        
        client = WeatherClient()
        
        # Try to get hourly forecast for 5 days from now (within 7-day limit)
        future_date = date.today() + timedelta(days=5)
        
        # Should succeed without raising an error
        forecast = client.get_hourly_forecast(start_date=future_date, end_date=future_date)
        assert forecast is not None