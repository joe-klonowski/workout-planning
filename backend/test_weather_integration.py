"""
Integration tests for Open-Meteo weather API client
These tests connect to the real Open-Meteo API and are skipped by default.

To run these tests:
    pytest -m integration

To skip these tests (default):
    pytest -m "not integration"
"""
import pytest
from datetime import date, timedelta
from weather_client import WeatherClient, WeatherAPIError


@pytest.mark.integration
class TestWeatherAPIIntegration:
    """Integration tests for Open-Meteo weather API"""
    
    @pytest.fixture
    def client(self):
        """Create a weather client for Chicago"""
        return WeatherClient()
    
    def test_api_is_accessible(self, client):
        """Test that the Open-Meteo API is accessible"""
        # Try to get a simple forecast
        try:
            forecast = client.get_forecast(date.today(), date.today())
            
            # Verify response structure
            assert 'latitude' in forecast
            assert 'longitude' in forecast
            assert 'timezone' in forecast
            assert 'dates' in forecast
            assert 'temperatures' in forecast
            
            print(f"\nAPI is accessible")
            print(f"  Location: {forecast['latitude']}, {forecast['longitude']}")
            print(f"  Timezone: {forecast['timezone']}")
            
        except WeatherAPIError as e:
            pytest.skip(f"Open-Meteo API is not accessible: {e}")
    
    def test_get_daily_forecast_today(self, client):
        """Test getting today's forecast"""
        forecast = client.get_daily_forecast(date.today())
        
        # Verify response structure
        assert 'date' in forecast
        assert 'temperature' in forecast
        assert 'rain_probability' in forecast
        assert 'windspeed' in forecast
        assert 'weather_code' in forecast
        assert 'description' in forecast
        
        # Verify data types
        assert isinstance(forecast['date'], str)
        assert isinstance(forecast['temperature'], (int, float))
        assert isinstance(forecast['rain_probability'], int)
        assert isinstance(forecast['windspeed'], (int, float))
        assert isinstance(forecast['weather_code'], int)
        assert isinstance(forecast['description'], str)
        
        print(f"\nToday's forecast:")
        print(f"  Temperature: {forecast['temperature']}°F")
        print(f"  Rain probability: {forecast['rain_probability']}%")
        print(f"  Wind speed: {forecast['windspeed']} mph")
        print(f"  Conditions: {forecast['description']}")
    
    def test_get_forecast_range(self, client):
        """Test getting forecast for a date range"""
        start_date = date.today()
        end_date = start_date + timedelta(days=4)
        
        forecast = client.get_forecast(start_date, end_date)
        
        # Verify response structure
        assert 'latitude' in forecast
        assert 'longitude' in forecast
        assert 'timezone' in forecast
        assert 'dates' in forecast
        assert 'temperatures' in forecast
        assert 'rain_probability' in forecast
        assert 'windspeed' in forecast
        assert 'weather_codes' in forecast
        
        # Verify all arrays have same length
        num_days = len(forecast['dates'])
        assert len(forecast['temperatures']) == num_days
        assert len(forecast['rain_probability']) == num_days
        assert len(forecast['windspeed']) == num_days
        assert len(forecast['weather_codes']) == num_days
        
        # Verify we got the expected number of days
        expected_days = (end_date - start_date).days + 1
        assert num_days == expected_days
        
        print(f"\n{num_days}-day forecast:")
        for i, date_str in enumerate(forecast['dates']):
            print(f"  {date_str}: {forecast['temperatures'][i]}°F, "
                  f"{forecast['rain_probability'][i]}% rain, "
                  f"{forecast['windspeed'][i]} mph wind")
    
    def test_get_hourly_forecast(self, client):
        """Test getting hourly forecast"""
        start_date = date.today()
        end_date = start_date + timedelta(days=1)
        
        hourly = client.get_hourly_forecast(start_date, end_date)
        
        # Verify response structure
        assert 'latitude' in hourly
        assert 'longitude' in hourly
        assert 'timezone' in hourly
        assert 'times' in hourly
        assert 'temperatures' in hourly
        assert 'rain_probability' in hourly
        assert 'windspeed' in hourly
        assert 'weather_codes' in hourly
        
        # Verify all arrays have same length
        num_hours = len(hourly['times'])
        assert len(hourly['temperatures']) == num_hours
        assert len(hourly['rain_probability']) == num_hours
        assert len(hourly['windspeed']) == num_hours
        assert len(hourly['weather_codes']) == num_hours
        
        # Verify we got hourly data (should be 24-48 hours for 1-2 days)
        assert num_hours >= 24
        
        print(f"\nHourly forecast for {num_hours} hours:")
        # Print first and last hour
        print(f"  First: {hourly['times'][0]} - {hourly['temperatures'][0]}°F")
        print(f"  Last: {hourly['times'][-1]} - {hourly['temperatures'][-1]}°F")
        print(f"  Total hours: {num_hours}")
    
    def test_get_weather_by_time_of_day(self, client):
        """Test getting weather grouped by time of day"""
        forecast_date = date.today()
        
        forecast = client.get_weather_by_time_of_day(forecast_date)
        
        # Verify response structure
        assert 'date' in forecast
        assert 'morning' in forecast
        assert 'afternoon' in forecast
        assert 'evening' in forecast
        
        # Verify each time period has expected fields
        for period in ['morning', 'afternoon', 'evening']:
            period_data = forecast[period]
            assert 'temperature' in period_data
            assert 'rain_probability' in period_data
            assert 'windspeed' in period_data
            assert 'weather_code' in period_data
            assert 'description' in period_data
        
        print(f"\nWeather by time of day for {forecast_date}:")
        print(f"  Morning: {forecast['morning']['temperature']}°F, "
              f"{forecast['morning']['description']}")
        print(f"  Afternoon: {forecast['afternoon']['temperature']}°F, "
              f"{forecast['afternoon']['description']}")
        print(f"  Evening: {forecast['evening']['temperature']}°F, "
              f"{forecast['evening']['description']}")
    
    def test_weather_code_descriptions(self, client):
        """Test that various weather codes have descriptions"""
        # Get a forecast and verify descriptions are non-empty
        forecast = client.get_daily_forecast(date.today())
        
        description = forecast['description']
        assert description is not None
        assert len(description) > 0
        assert description != 'Unknown'
        
        print(f"\nWeather code {forecast['weather_code']} description: {description}")
    
    def test_multiple_days_forecast(self, client):
        """Test getting forecast for multiple days"""
        start_date = date.today()
        end_date = start_date + timedelta(days=6)  # 7-day forecast
        
        forecast = client.get_forecast(start_date, end_date)
        
        # Verify we got all 7 days
        assert len(forecast['dates']) == 7
        
        # Verify temperature ranges are reasonable
        for temp in forecast['temperatures']:
            # Should be between -50°F and 130°F (reasonable for Earth)
            assert -50 < temp < 130
        
        # Verify rain probability is 0-100
        for rain in forecast['rain_probability']:
            assert 0 <= rain <= 100
        
        # Verify wind speed is non-negative
        for wind in forecast['windspeed']:
            assert wind >= 0
        
        print(f"\n7-day forecast validation:")
        print(f"  Dates: {forecast['dates'][0]} to {forecast['dates'][-1]}")
        print(f"  Temp range: {min(forecast['temperatures'])}°F to "
              f"{max(forecast['temperatures'])}°F")
        print(f"  Max rain: {max(forecast['rain_probability'])}%")
    
    def test_chicago_location(self, client):
        """Verify client is configured for Chicago"""
        # Get a range forecast which includes timezone info
        forecast = client.get_forecast(date.today(), date.today())
        
        # Chicago coordinates (with some tolerance for rounding)
        expected_lat = 41.795604164195446
        expected_lon = -87.57838836383468
        
        # Latitude should be close to Chicago (within 0.05 degrees)
        assert abs(forecast['latitude'] - expected_lat) < 0.05
        
        # Longitude should be close to Chicago (within 0.05 degrees)
        assert abs(forecast['longitude'] - expected_lon) < 0.05
        
        # Timezone should be America/Chicago
        assert forecast['timezone'] == 'America/Chicago'
        
        print(f"\nVerified Chicago location: {forecast['latitude']}, {forecast['longitude']}")
        print(f"  Timezone: {forecast['timezone']}")
    
    def test_api_response_times(self, client):
        """Test that API responses are reasonably fast"""
        import time
        
        # Test daily forecast response time
        start = time.time()
        client.get_daily_forecast(date.today())
        daily_time = time.time() - start
        
        print(f"\nAPI response times:")
        print(f"  Daily forecast: {daily_time:.3f}s")
        
        # Response should be reasonably fast (< 10 seconds)
        assert daily_time < 10
        
        # Test hourly forecast response time
        start = time.time()
        client.get_hourly_forecast(date.today(), date.today() + timedelta(days=1))
        hourly_time = time.time() - start
        
        print(f"  Hourly forecast: {hourly_time:.3f}s")
        assert hourly_time < 10
        
        # Test time-of-day forecast response time
        start = time.time()
        client.get_weather_by_time_of_day(date.today())
        tofday_time = time.time() - start
        
        print(f"  Time-of-day forecast: {tofday_time:.3f}s")
        assert tofday_time < 10
