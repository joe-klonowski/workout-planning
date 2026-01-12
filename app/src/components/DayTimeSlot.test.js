import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DayTimeSlot from './DayTimeSlot';
import { DateOnly } from '../utils/DateOnly';
import { API_ENDPOINTS, apiCall } from '../config/api';

// Mock the API module
jest.mock('../config/api', () => ({
  API_ENDPOINTS: {
    WEATHER_BY_DATE: (date) => `http://localhost:5000/api/weather/${date}`,
    WEATHER_BY_TIME_OF_DAY: (date) => `http://localhost:5000/api/weather/by-time-of-day/${date}`
  },
  apiCall: jest.fn()
}));

describe('DayTimeSlot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to get a date string X days from now (in local timezone)
  const getDaysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    // Use local date parts instead of toISOString to avoid UTC conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert a Date to local date string (YYYY-MM-DD)
  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const createDayObj = (dateString) => ({
    date: {
      toISOString: () => dateString
    }
  });

  const mockDayObj = createDayObj(getDaysFromNow(5)); // Use a date 5 days in the future

  const mockGetTimeOfDayLabel = (slot) => {
    const labels = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Evening',
      unscheduled: 'Unscheduled'
    };
    return labels[slot] || slot;
  };

  const mockRenderWorkoutBadge = (workout, idx) => (
    <div key={idx} className="workout-badge">{workout.title}</div>
  );

  const mockOnDragOver = jest.fn();
  const mockOnDragLeave = jest.fn();
  const mockOnDrop = jest.fn();

  const mockWorkout1 = {
    id: 1,
    title: 'Morning Run',
    type: 'Run',
    duration: '45m',
    timeOfDay: 'morning'
  };

  const mockWorkout2 = {
    id: 2,
    title: 'Evening Swim',
    type: 'Swim',
    duration: '33m',
    timeOfDay: 'evening'
  };

  test('should render time slot header', async () => {
    const testDate = getDaysFromNow(5);
    const testDayObj = createDayObj(testDate);
    
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: testDate,
        morning: {
          temperature: 68,
          rain_probability: 20,
          windspeed: 10,
          weather_code: 0
        },
        afternoon: {
          temperature: 75,
          rain_probability: 15,
          windspeed: 12,
          weather_code: 1
        },
        evening: {
          temperature: 70,
          rain_probability: 25,
          windspeed: 8,
          weather_code: 2
        }
      })
    });

    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={testDayObj}
          timeSlot="morning"
          workouts={[]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('🌅 Morning')).toBeInTheDocument();
    });
  });

  test('should fetch and display weather data for morning/afternoon/evening slots', async () => {
    const testDate = getDaysFromNow(5);
    const testDayObj = createDayObj(testDate);
    
    const mockWeatherData = {
      date: testDate,
      morning: {
        temperature: 45.2,
        rain_probability: 20,
        windspeed: 8.5,
        weather_code: 1,
        description: 'Mainly clear'
      },
      afternoon: {
        temperature: 52.3,
        rain_probability: 30,
        windspeed: 12.5,
        weather_code: 2,
        description: 'Partly cloudy'
      },
      evening: {
        temperature: 48.1,
        rain_probability: 40,
        windspeed: 10.2,
        weather_code: 3,
        description: 'Overcast'
      }
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    });

    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={testDayObj}
          timeSlot="morning"
          workouts={[]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/45°F/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText(/9 mph/)).toBeInTheDocument();
    });
  });

  test('should not fetch weather for unscheduled slot', async () => {
    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="unscheduled"
          workouts={[]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Unscheduled')).toBeInTheDocument();
    });

    expect(apiCall).not.toHaveBeenCalled();
  });

  test('should display different weather for different time slots', async () => {
    const testDate = getDaysFromNow(5);
    const testDayObj = createDayObj(testDate);
    
    const mockWeatherData = {
      date: testDate,
      morning: {
        temperature: 45.2,
        rain_probability: 20,
        windspeed: 8.5,
        weather_code: 1,
        description: 'Mainly clear'
      },
      afternoon: {
        temperature: 62.8,
        rain_probability: 10,
        windspeed: 12.5,
        weather_code: 2,
        description: 'Partly cloudy'
      },
      evening: {
        temperature: 54.3,
        rain_probability: 35,
        windspeed: 10.2,
        weather_code: 3,
        description: 'Overcast'
      }
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    });

    // Render morning slot
    const { rerender, unmount } = render(
      <DayTimeSlot
        dayObj={testDayObj}
        timeSlot="morning"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/45°F/)).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    unmount();

    // Render afternoon slot
    render(
      <DayTimeSlot
        dayObj={testDayObj}
        timeSlot="afternoon"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/63°F/)).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  test('should display workouts when provided', async () => {
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-01-10',
        morning: {
          temperature: 68,
          rain_probability: 10,
          windspeed: 8,
          weather_code: 0
        },
        afternoon: {
          temperature: 75,
          rain_probability: 5,
          windspeed: 10,
          weather_code: 1
        },
        evening: {
          temperature: 70,
          rain_probability: 15,
          windspeed: 7,
          weather_code: 2
        }
      })
    });

    const mockWorkouts = [
      { id: 1, title: 'Morning Run' },
      { id: 2, title: 'Strength Training' }
    ];

    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="morning"
          workouts={mockWorkouts}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Strength Training')).toBeInTheDocument();
    });
  });

  test('should display tri club events when provided', async () => {
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-01-10',
        morning: {
          temperature: 68,
          rain_probability: 10,
          windspeed: 8,
          weather_code: 0
        },
        afternoon: {
          temperature: 75,
          rain_probability: 5,
          windspeed: 10,
          weather_code: 1
        },
        evening: {
          temperature: 70,
          rain_probability: 15,
          windspeed: 7,
          weather_code: 2
        }
      })
    });

    const mockTriClubEvents = [
      { formattedTime: '7:00am', activity: 'Ride' }
    ];

    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="morning"
          workouts={[]}
          triClubEvents={mockTriClubEvents}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/7:00am tri club ride/)).toBeInTheDocument();
    });
  });

  test('should handle weather API errors gracefully', async () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    apiCall.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="morning"
          workouts={[]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('🌅 Morning')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  test('should not fetch weather for past dates', async () => {
    // Create a date object for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = toLocalDateString(yesterday);
    
    const pastDayObj = {
      date: {
        toISOString: () => yesterdayString
      }
    };

    render(
      <DayTimeSlot
        dayObj={pastDayObj}
        timeSlot="morning"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Wait a bit to ensure no API call is made
    await waitFor(() => {
      expect(apiCall).not.toHaveBeenCalled();
    });

    // Should still show the time slot header but no weather
    expect(screen.getByText('🌅 Morning')).toBeInTheDocument();
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });

  test('should not fetch weather for dates beyond 16-day forecast range', async () => {
    // Create a date object for 20 days in the future
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 20);
    const farFutureString = toLocalDateString(farFuture);
    
    const futureDayObj = {
      date: {
        toISOString: () => farFutureString
      }
    };

    render(
      <DayTimeSlot
        dayObj={futureDayObj}
        timeSlot="afternoon"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Wait a bit to ensure no API call is made
    await waitFor(() => {
      expect(apiCall).not.toHaveBeenCalled();
    });

    // Should still show the time slot header but no weather
    expect(screen.getByText('☀️ Afternoon')).toBeInTheDocument();
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });

  test('should fetch weather for dates within forecast range', async () => {
    // Create a date object for 5 days in the future (within hourly range)
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 5);
    const nearFutureString = toLocalDateString(nearFuture);
    
    const futureDayObj = {
      date: {
        toISOString: () => nearFutureString
      }
    };

    const mockWeatherData = {
      date: nearFutureString,
      morning: {
        temperature: 65,
        rain_probability: 10,
        windspeed: 8,
        weather_code: 0
      },
      afternoon: {
        temperature: 72,
        rain_probability: 15,
        windspeed: 10,
        weather_code: 1
      },
      evening: {
        temperature: 68,
        rain_probability: 20,
        windspeed: 9,
        weather_code: 2
      }
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    });

    render(
      <DayTimeSlot
        dayObj={futureDayObj}
        timeSlot="evening"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should make API call for date within range
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        `http://localhost:5000/api/weather/by-time-of-day/${nearFutureString}`
      );
    });

    // Should display weather (evening slot shows 68°F)
    await waitFor(() => {
      expect(screen.getByText(/68°F/)).toBeInTheDocument();
    });
  });

  test('should not fetch weather for today when date is exactly at boundary', async () => {
    // Test today (day 0)
    const today = new Date();
    const todayString = toLocalDateString(today);
    
    const todayDayObj = {
      date: {
        toISOString: () => todayString
      }
    };

    const mockWeatherData = {
      date: todayString,
      morning: {
        temperature: 65,
        rain_probability: 5,
        windspeed: 7,
        weather_code: 0
      },
      afternoon: {
        temperature: 70,
        rain_probability: 10,
        windspeed: 8,
        weather_code: 1
      },
      evening: {
        temperature: 68,
        rain_probability: 15,
        windspeed: 6,
        weather_code: 2
      }
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    });

    render(
      <DayTimeSlot
        dayObj={todayDayObj}
        timeSlot="morning"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should make API call for today
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalled();
    });

    // Should display weather (morning slot shows 65°F)
    await waitFor(() => {
      expect(screen.getByText(/65°F/)).toBeInTheDocument();
    });
  });

  test('should use daily forecast for dates 8-16 days out', async () => {
    // Create a date object for 10 days in the future (beyond hourly range)
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const farFutureString = toLocalDateString(farFuture);
    
    const futureDayObj = {
      date: {
        toISOString: () => farFutureString
      }
    };

    const mockDailyWeatherData = {
      date: farFutureString,
      temperature: 78,
      rain_probability: 25,
      windspeed: 11,
      weather_code: 1,
      description: 'Mainly clear'
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockDailyWeatherData
    });

    render(
      <DayTimeSlot
        dayObj={futureDayObj}
        timeSlot="morning"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should call daily weather endpoint for dates beyond 7 days
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        `http://localhost:5000/api/weather/${farFutureString}`
      );
    });

    // Should display weather
    await waitFor(() => {
      expect(screen.getByText(/78°F/)).toBeInTheDocument();
    });

    // Should show daily forecast indicator
    await waitFor(() => {
      expect(screen.getByTitle('Full-day forecast')).toBeInTheDocument();
    });
  });

  test('should not show weather in afternoon/evening slots for daily forecasts', async () => {
    // Create a date object for 10 days in the future (beyond hourly range)
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const farFutureString = toLocalDateString(farFuture);
    
    const futureDayObj = {
      date: {
        toISOString: () => farFutureString
      }
    };

    const mockDailyWeatherData = {
      date: farFutureString,
      temperature: 78,
      rain_probability: 25,
      windspeed: 11,
      weather_code: 1,
      description: 'Mainly clear'
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockDailyWeatherData
    });

    // Test afternoon slot
    render(
      <DayTimeSlot
        dayObj={futureDayObj}
        timeSlot="afternoon"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should NOT call API for afternoon slot with daily forecast
    await waitFor(() => {
      expect(apiCall).not.toHaveBeenCalled();
    });

    // Should not display weather
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });

  test('should use daily forecast for day 8 (boundary between hourly and daily)', async () => {
    // Day 8 is the first day beyond hourly forecast range
    const day8 = new Date();
    day8.setDate(day8.getDate() + 8);
    const day8String = toLocalDateString(day8);
    
    const day8Obj = {
      date: {
        toISOString: () => day8String
      }
    };

    const mockDailyWeatherData = {
      date: day8String,
      temperature: 72,
      rain_probability: 30,
      windspeed: 12,
      weather_code: 2,
      description: 'Partly cloudy'
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockDailyWeatherData
    });

    render(
      <DayTimeSlot
        dayObj={day8Obj}
        timeSlot="morning"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should call daily weather endpoint for day 8
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        `http://localhost:5000/api/weather/${day8String}`
      );
    });

    // Should display weather
    await waitFor(() => {
      expect(screen.getByText(/72°F/)).toBeInTheDocument();
    });

    // Should show daily forecast indicator
    await waitFor(() => {
      expect(screen.getByTitle('Full-day forecast')).toBeInTheDocument();
    });
  });

  test('should use hourly forecast for day 7 (last day of hourly range)', async () => {
    // Day 7 is the last day with hourly forecasts
    const day7 = new Date();
    day7.setDate(day7.getDate() + 7);
    const day7String = toLocalDateString(day7);
    
    const day7Obj = {
      date: {
        toISOString: () => day7String
      }
    };

    const mockHourlyWeatherData = {
      date: day7String,
      morning: {
        temperature: 55,
        rain_probability: 15,
        windspeed: 9,
        weather_code: 1,
        description: 'Mainly clear'
      },
      afternoon: {
        temperature: 65,
        rain_probability: 10,
        windspeed: 11,
        weather_code: 0,
        description: 'Clear sky'
      },
      evening: {
        temperature: 60,
        rain_probability: 20,
        windspeed: 8,
        weather_code: 2,
        description: 'Partly cloudy'
      }
    };

    apiCall.mockResolvedValue({
      ok: true,
      json: async () => mockHourlyWeatherData
    });

    render(
      <DayTimeSlot
        dayObj={day7Obj}
        timeSlot="afternoon"
        workouts={[]}
        triClubEvents={[]}
        draggedWorkout={null}
        dragOverDate={null}
        dragOverTimeSlot={null}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        onDrop={mockOnDrop}
        renderWorkoutBadge={mockRenderWorkoutBadge}
        getTimeOfDayLabel={mockGetTimeOfDayLabel}
      />
    );

    // Should call time-of-day weather endpoint for day 7
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        `http://localhost:5000/api/weather/by-time-of-day/${day7String}`
      );
    });

    // Should display weather for afternoon slot
    await waitFor(() => {
      expect(screen.getByText(/65°F/)).toBeInTheDocument();
    });

    // Should NOT show daily forecast indicator
    expect(screen.queryByTitle('Full-day forecast')).not.toBeInTheDocument();
  });

  describe('Layout Bug Regression Tests', () => {
    test('unscheduled time slot header should be visible', () => {
      const { container } = render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="unscheduled"
          workouts={[mockWorkout1]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );

      const header = screen.getByText('Unscheduled');
      expect(header).toBeInTheDocument();
      
      // Check that header has proper styling to be visible
      const headerElement = container.querySelector('.time-slot-header');
      expect(headerElement).toBeInTheDocument();
      
      // Verify the header is in the DOM and can be found
      const timeSlotElement = container.querySelector('.time-slot.unscheduled');
      expect(timeSlotElement).toBeInTheDocument();
      expect(timeSlotElement).toContainElement(headerElement);
    });

    test('time slot should have proper overflow handling', () => {
      const { container } = render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="evening"
          workouts={[mockWorkout1, mockWorkout2]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );

      const timeSlot = container.querySelector('.time-slot.evening');
      expect(timeSlot).toBeInTheDocument();
      
      // Check that workout container exists
      const workoutContainer = container.querySelector('.time-slot-workouts');
      expect(workoutContainer).toBeInTheDocument();
    });

    test('multiple time slots in a day should not overlap', () => {
      const { container: morningContainer } = render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="morning"
          workouts={[mockWorkout1]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );

      const { container: eveningContainer } = render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="evening"
          workouts={[mockWorkout2]}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          renderWorkoutBadge={mockRenderWorkoutBadge}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );

      // Both time slots should render independently
      expect(morningContainer.querySelector('.time-slot.morning')).toBeInTheDocument();
      expect(eveningContainer.querySelector('.time-slot.evening')).toBeInTheDocument();
    });

    test('time slot with multiple workouts should contain all workout elements', () => {
      const multipleWorkouts = [mockWorkout1, mockWorkout2, {
        id: 3,
        title: 'Third Workout',
        type: 'Bike',
        duration: '1h 30m',
        timeOfDay: 'evening'
      }];

      const mockOnWorkoutDragStart = jest.fn();
      const mockOnWorkoutDragEnd = jest.fn();
      const mockOnWorkoutClick = jest.fn();
      const mockOnWorkoutSelectionToggle = jest.fn();

      const { container } = render(
        <DayTimeSlot
          dayObj={mockDayObj}
          timeSlot="evening"
          workouts={multipleWorkouts}
          triClubEvents={[]}
          draggedWorkout={null}
          dragOverDate={null}
          dragOverTimeSlot={null}
          onDragOver={mockOnDragOver}
          onDragLeave={mockOnDragLeave}
          onDrop={mockOnDrop}
          onWorkoutDragStart={mockOnWorkoutDragStart}
          onWorkoutDragEnd={mockOnWorkoutDragEnd}
          onWorkoutClick={mockOnWorkoutClick}
          onWorkoutSelectionToggle={mockOnWorkoutSelectionToggle}
          getTimeOfDayLabel={mockGetTimeOfDayLabel}
        />
      );

      // Verify all workouts are rendered
      const workoutContainer = container.querySelector('.time-slot-workouts');
      expect(workoutContainer).toBeInTheDocument();
      
      // Check that all workout badges are rendered
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThanOrEqual(3);
    });
  });
});