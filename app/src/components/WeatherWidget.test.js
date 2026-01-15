import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { weatherCache } from '../utils/weatherCache';

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
    weatherCache.clear();
  });

  // Helper function to get a date string X days from now (in local timezone)
  const getDaysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  test('should render nothing when isOpen is false', async () => {
    const { container } = render(
      <WeatherWidget 
        date={getDaysFromNow(1)} 
        workoutType="Run" 
        isOpen={false} 
      />
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('should render nothing when date is not provided', async () => {
    const { container } = render(
      <WeatherWidget 
        date={null} 
        workoutType="Run" 
        isOpen={true} 
      />
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('should show loading state while fetching', async () => {
    apiCall.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    
    render(
      <WeatherWidget 
        date={getDaysFromNow(1)} 
        workoutType="Run" 
        isOpen={true} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Loading weather...')).toBeInTheDocument();
    });
  });

  test('should display weather data when fetch succeeds', async () => {
    const testDate = getDaysFromNow(1);
    const mockWeatherData = {
      date: testDate,
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
        date={testDate} 
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
    const testDate1 = getDaysFromNow(1);
    const testDate2 = getDaysFromNow(2);
    
    const mockWeatherData1 = {
      date: testDate1,
      temperature: 50,
      rain_probability: 20,
      windspeed: 10,
      weather_code: 0,
      description: 'Clear sky'
    };

    const mockWeatherData2 = {
      date: testDate2,
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
        date={testDate1} 
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
        date={testDate2} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    });
  });

  test('should call API with correct endpoint', async () => {
    const testDate = getDaysFromNow(1);
    const mockWeatherData = {
      date: testDate,
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
        date={testDate} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        `http://localhost:5000/api/weather/${testDate}`
      );
    });
  });

  test('should not fetch weather for dates beyond 16-day forecast range', async () => {
    // Calculate a date 20 days in the future (beyond the 16-day limit)
    const futureDateString = (() => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const { container } = render(
      <WeatherWidget 
        date={futureDateString} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    // Wait a bit to ensure no API call is made
    await waitFor(() => {
      expect(apiCall).not.toHaveBeenCalled();
    });

    // Widget should render nothing
    expect(container.firstChild).toBeNull();
  });

  test('should not fetch weather for dates beyond 16-day forecast range even after date change', async () => {
    const mockWeatherData = {
      date: '2026-01-15',
      temperature: 50,
      rain_probability: 20,
      windspeed: 10,
      weather_code: 0,
      description: 'Clear sky'
    };

    const mockResponse = {
      ok: true,
      json: async () => mockWeatherData
    };

    apiCall.mockResolvedValueOnce(mockResponse);

    // Start with a date within range
    const nearDateString = (() => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 5);
      const year = nearDate.getFullYear();
      const month = String(nearDate.getMonth() + 1).padStart(2, '0');
      const day = String(nearDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const { container, rerender } = render(
      <WeatherWidget 
        date={nearDateString} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    // Change to a date beyond the forecast range
    const farDateString = (() => {
      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 20);
      const year = farDate.getFullYear();
      const month = String(farDate.getMonth() + 1).padStart(2, '0');
      const day = String(farDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    rerender(
      <WeatherWidget 
        date={farDateString} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    // Should not make another API call
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    // Widget should render nothing
    expect(container.firstChild).toBeNull();
  });

  test('should fetch weather for dates within 16-day forecast range', async () => {
    // Calculate a date 10 days in the future (within the 16-day limit)
    const futureDate = getDaysFromNow(10);
    
    const mockWeatherData = {
      date: futureDate,
      temperature: 55,
      rain_probability: 10,
      windspeed: 8,
      weather_code: 1,
      description: 'Mainly clear'
    };

    const mockResponse = {
      ok: true,
      json: async () => mockWeatherData
    };

    apiCall.mockResolvedValueOnce(mockResponse);

    render(
      <WeatherWidget 
        date={futureDate} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    // Should make API call
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    // Should display weather
    await waitFor(() => {
      expect(screen.getByText('Mainly clear')).toBeInTheDocument();
    });
  });

  test('should not fetch weather for past dates', async () => {
    // Calculate yesterday's date
    const yesterdayString = (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const { container } = render(
      <WeatherWidget 
        date={yesterdayString} 
        workoutType="Run" 
        isOpen={true} 
      />
    );

    // Should not make API call
    await waitFor(() => {
      expect(apiCall).not.toHaveBeenCalled();
    });

    // Widget should render nothing
    expect(container.firstChild).toBeNull();
  });
});
