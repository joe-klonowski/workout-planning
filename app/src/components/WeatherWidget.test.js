import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';
import { API_ENDPOINTS, apiCall } from '../config/api';

// Mock the API module
jest.mock('../config/api', () => ({
  API_ENDPOINTS: {
    WEATHER_BY_DATE: (date) => `http://localhost:5000/api/weather/${date}`
  },
  apiCall: jest.fn()
}));

describe('WeatherWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render nothing when isOpen is false', () => {
    const { container } = render(
      <WeatherWidget 
        date="2026-01-10" 
        workoutType="Run" 
        isOpen={false} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('should render nothing when date is not provided', () => {
    const { container } = render(
      <WeatherWidget 
        date={null} 
        workoutType="Run" 
        isOpen={true} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('should show loading state while fetching', () => {
    apiCall.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    
    render(
      <WeatherWidget 
        date="2026-01-10" 
        workoutType="Run" 
        isOpen={true} 
      />
    );
    
    expect(screen.getByText('Loading weather...')).toBeInTheDocument();
  });

  test('should display weather data when fetch succeeds', async () => {
    const mockWeatherData = {
      date: '2026-01-10',
      temperature: 52.3,
      rain_probability: 30,
      windspeed: 12.5,
      weather_code: 2,
      description: 'Partly cloudy'
    };

    const mockResponse = {
      ok: true,
      json: async () => mockWeatherData
    };

    apiCall.mockResolvedValueOnce(mockResponse);

    render(
      <WeatherWidget 
        date="2026-01-10" 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    });

    expect(screen.getByText(/52°F/)).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText(/13 mph/)).toBeInTheDocument();
  });

  test('should refetch when date prop changes', async () => {
    const mockWeatherData1 = {
      date: '2026-01-10',
      temperature: 50,
      rain_probability: 20,
      windspeed: 10,
      weather_code: 0,
      description: 'Clear sky'
    };

    const mockWeatherData2 = {
      date: '2026-01-11',
      temperature: 60,
      rain_probability: 40,
      windspeed: 15,
      weather_code: 2,
      description: 'Partly cloudy'
    };

    const mockResponse1 = {
      ok: true,
      json: async () => mockWeatherData1
    };

    const mockResponse2 = {
      ok: true,
      json: async () => mockWeatherData2
    };

    apiCall.mockResolvedValueOnce(mockResponse1);

    const { rerender } = render(
      <WeatherWidget 
        date="2026-01-10" 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Clear sky')).toBeInTheDocument();
    });

    // Change the date
    apiCall.mockResolvedValueOnce(mockResponse2);

    rerender(
      <WeatherWidget 
        date="2026-01-11" 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    });
  });

  test('should call API with correct endpoint', async () => {
    const mockWeatherData = {
      date: '2026-01-10',
      temperature: 52.3,
      rain_probability: 30,
      windspeed: 12.5,
      weather_code: 2,
      description: 'Partly cloudy'
    };

    const mockResponse = {
      ok: true,
      json: async () => mockWeatherData
    };

    apiCall.mockResolvedValueOnce(mockResponse);

    render(
      <WeatherWidget 
        date="2026-01-10" 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        'http://localhost:5000/api/weather/2026-01-10'
      );
    });
  });
});
