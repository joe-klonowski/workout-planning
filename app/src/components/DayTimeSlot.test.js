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

  const mockDayObj = {
    date: {
      toISOString: () => '2026-01-10'
    }
  };

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
    apiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        date: '2026-01-10',
        temperature: 68,
        rain_probability: 20,
        windspeed: 10,
        weather_code: 0
      })
    });

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
  });

  test('should fetch and display weather data for morning/afternoon/evening slots', async () => {
    const mockWeatherData = {
      date: '2026-01-10',
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
});
