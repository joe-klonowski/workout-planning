import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DayTimeSlot from './DayTimeSlot';
import { DateOnly } from '../utils/DateOnly';
import { API_ENDPOINTS, apiCall } from '../config/api';

// Mock the API module
jest.mock('../config/api', () => ({
  API_ENDPOINTS: {
    WEATHER_BY_DATE: (date) => `http://localhost:5000/api/weather/${date}`
  },
  apiCall: jest.fn()
}));

describe('DayTimeSlot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to get a date string X days from now
  const getDaysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
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

  test('should render time slot header', async () => {
    const testDate = getDaysFromNow(5);
    const testDayObj = createDayObj(testDate);
    
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: testDate,
        temperature: 68,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 0
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
      temperature: 52.3,
      rain_probability: 30,
      windspeed: 12.5,
      weather_code: 2,
      description: 'Partly cloudy'
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
      expect(screen.getByText(/52°F/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText(/13 mph/)).toBeInTheDocument();
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

  test('should display workouts when provided', async () => {
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-01-10',
        temperature: 68,
        rain_probability: 10,
        windspeed: 8,
        weather_code: 0
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
        temperature: 68,
        rain_probability: 10,
        windspeed: 8,
        weather_code: 0
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
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
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
    const farFutureString = farFuture.toISOString().split('T')[0];
    
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
    // Create a date object for 10 days in the future
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 10);
    const nearFutureString = nearFuture.toISOString().split('T')[0];
    
    const futureDayObj = {
      date: {
        toISOString: () => nearFutureString
      }
    };

    const mockWeatherData = {
      date: nearFutureString,
      temperature: 72,
      rain_probability: 15,
      windspeed: 10,
      weather_code: 1
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
        `http://localhost:5000/api/weather/${nearFutureString}`
      );
    });

    // Should display weather
    await waitFor(() => {
      expect(screen.getByText(/72°F/)).toBeInTheDocument();
    });
  });

  test('should not fetch weather for today when date is exactly at boundary', async () => {
    // Test today (day 0)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const todayDayObj = {
      date: {
        toISOString: () => todayString
      }
    };

    const mockWeatherData = {
      date: todayString,
      temperature: 70,
      rain_probability: 10,
      windspeed: 8,
      weather_code: 0
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

    // Should display weather
    await waitFor(() => {
      expect(screen.getByText(/70°F/)).toBeInTheDocument();
    });
  });
});
