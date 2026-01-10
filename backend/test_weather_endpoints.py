"""
Tests for weather API endpoints in app.py
"""
import pytest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from app import create_app
from models import db


@pytest.fixture
def app():
    """Create and configure a test app instance"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app"""
    return app.test_client()


class TestWeatherEndpoints:
    """Test cases for weather API endpoints"""
    
    @patch('weather_client.requests.get')
    def test_get_weather_success(self, mock_get, client):
        """Test successful weather forecast retrieval"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10', '2026-01-11'],
                'temperature_2m_max': [32.5, 35.2],
                'precipitation_probability_max': [20, 60],
                'windspeed_10m_max': [10.5, 15.3],
                'weather_code': [2, 51]
            }
        }
        mock_get.return_value = mock_response
        
        response = client.get('/api/weather')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'dates' in data
        assert 'temperatures' in data
        assert len(data['dates']) == 2
    
    @patch('weather_client.requests.get')
    def test_get_weather_with_date_params(self, mock_get, client):
        """Test weather endpoint with custom date parameters"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10'],
                'temperature_2m_max': [32.5],
                'precipitation_probability_max': [20],
                'windspeed_10m_max': [10.5],
                'weather_code': [2]
            }
        }
        mock_get.return_value = mock_response
        
        response = client.get('/api/weather?start_date=2026-01-10&end_date=2026-01-10')
        
        assert response.status_code == 200
    
    def test_get_weather_invalid_date_format(self, client):
        """Test weather endpoint with invalid date format"""
        response = client.get('/api/weather?start_date=not-a-date')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'Invalid date format' in data['error']
    
    @patch('weather_client.requests.get')
    def test_get_weather_api_error(self, mock_get, client):
        """Test weather endpoint when weather API fails"""
        mock_get.side_effect = Exception("API Error")
        
        response = client.get('/api/weather')
        
        assert response.status_code == 503
        data = response.get_json()
        assert 'error' in data
    
    @patch('weather_client.requests.get')
    def test_get_daily_weather_success(self, mock_get, client):
        """Test successful daily weather retrieval"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10'],
                'temperature_2m_max': [35.5],
                'precipitation_probability_max': [40],
                'windspeed_10m_max': [12.3],
                'weather_code': [61]
            }
        }
        mock_get.return_value = mock_response
        
        response = client.get('/api/weather/2026-01-10')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['date'] == '2026-01-10'
        assert data['temperature'] == 35.5
        assert 'description' in data
    
    def test_get_daily_weather_invalid_date_format(self, client):
        """Test daily weather endpoint with invalid date format"""
        response = client.get('/api/weather/not-a-date')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    @patch('weather_client.requests.get')
    def test_get_daily_weather_api_error(self, mock_get, client):
        """Test daily weather endpoint when API fails"""
        mock_get.side_effect = Exception("API Error")
        
        response = client.get('/api/weather/2026-01-10')
        
        assert response.status_code == 503
        data = response.get_json()
        assert 'error' in data
    
    @patch('weather_client.requests.get')
    def test_weather_endpoints_use_correct_client(self, mock_get, client):
        """Test that endpoints work with real client"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'daily': {
                'time': ['2026-01-10'],
                'temperature_2m_max': [35.5],
                'precipitation_probability_max': [40],
                'windspeed_10m_max': [12.3],
                'weather_code': [61]
            }
        }
        mock_get.return_value = mock_response
        
        # Test forecast endpoint
        response = client.get('/api/weather')
        assert response.status_code == 200
        
        # Test daily endpoint
        response = client.get('/api/weather/2026-01-10')
        assert response.status_code == 200


class TestTimeOfDayWeatherEndpoints:
    """Test cases for time-of-day weather endpoints"""
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_success(self, mock_get, client):
        """Test successful time-of-day weather retrieval"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'latitude': 41.8,
            'longitude': -87.6,
            'timezone': 'America/Chicago',
            'hourly': {
                'time': [
                    '2026-01-10T05:00',
                    '2026-01-10T08:00',
                    '2026-01-10T12:00',
                    '2026-01-10T14:00',
                    '2026-01-10T17:00',
                    '2026-01-10T19:00'
                ],
                'temperature_2m': [28.0, 32.0, 36.0, 35.0, 30.0, 25.0],
                'precipitation_probability': [10, 10, 20, 20, 30, 40],
                'windspeed_10m': [8.0, 10.0, 12.0, 13.0, 14.0, 10.0],
                'weather_code': [0, 0, 2, 2, 1, 1]
            }
        }
        mock_get.return_value = mock_response
        
        response = client.get('/api/weather/by-time-of-day/2026-01-10')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['date'] == '2026-01-10'
        assert 'morning' in data
        assert 'afternoon' in data
        assert 'evening' in data
        assert data['morning']['temperature'] == 30.0
        assert data['afternoon']['rain_probability'] == 20
        assert data['evening']['windspeed'] == 12.0
    
    def test_get_weather_by_time_of_day_invalid_date_format(self, client):
        """Test time-of-day endpoint with invalid date format"""
        response = client.get('/api/weather/by-time-of-day/not-a-date')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'Invalid date format' in data['error']
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_api_error(self, mock_get, client):
        """Test time-of-day endpoint when weather API fails"""
        mock_get.side_effect = Exception("API failed")
        
        response = client.get('/api/weather/by-time-of-day/2026-01-10')
        
        assert response.status_code == 503
        data = response.get_json()
        assert 'error' in data
    
    @patch('weather_client.requests.get')
    def test_get_weather_by_time_of_day_generic_error(self, mock_get, client):
        """Test time-of-day endpoint with unexpected error"""
        mock_get.side_effect = Exception("Unexpected error")
        
        response = client.get('/api/weather/by-time-of-day/2026-01-10')
        
        assert response.status_code == 503
        data = response.get_json()
        assert 'error' in data
