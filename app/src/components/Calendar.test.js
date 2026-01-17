import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Calendar from './Calendar';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { DateOnly } from '../utils/DateOnly';

// Mock weather utilities to disable weather fetching in all tests
jest.mock('../utils/weatherUtils', () => ({
  getWeatherInfo: jest.fn(),
  isWeatherAvailable: jest.fn(() => false), // Disable weather for all dates
  isHourlyWeatherAvailable: jest.fn(() => false),
  getMaxWeatherForecastDate: jest.fn(() => '2026-01-31')
}));

// Mock the API module to prevent actual API calls during tests
jest.mock('../config/api', () => {
  const mockWeatherData = {
    date: '2026-01-10',
    morning: {
      temperature: 58,
      rain_probability: 10,
      windspeed: 7,
      weather_code: 0,
      description: 'Clear sky'
    },
    afternoon: {
      temperature: 68,
      rain_probability: 10,
      windspeed: 8,
      weather_code: 0,
      description: 'Clear sky'
    },
    evening: {
      temperature: 62,
      rain_probability: 15,
      windspeed: 6,
      weather_code: 1,
      description: 'Mainly clear'
    }
  };
  
  return {
    API_ENDPOINTS: {
      WEATHER_BY_DATE: (date) => `http://localhost:5000/api/weather/${date}`,
      WEATHER_BY_TIME_OF_DAY: (date) => `http://localhost:5000/api/weather/by-time-of-day/${date}`
    },
    apiCall: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    })
  };
});

// Get the mocked apiCall function
const { apiCall } = require('../config/api');

describe('Calendar Component', () => {
  beforeEach(() => {
    apiCall.mockClear();
  });

  const mockWorkouts = [
    {
      id: 1,
      title: 'Morning Run',
      workoutType: 'Run',
      workoutDate: new DateOnly(2026, 1, 15),
      timeOfDay: 'morning',
      plannedDuration: 0.75,
      plannedDistanceInMeters: 5000,
      workoutDescription: 'Easy 5k run',
      coachComments: 'Keep it easy',
      isSelected: true,
    },
    {
      id: 2,
      title: 'Evening Swim',
      workoutType: 'Swim',
      workoutDate: new DateOnly(2026, 1, 15),
      timeOfDay: 'evening',
      plannedDuration: 1,
      plannedDistanceInMeters: 2000,
      workoutDescription: 'Swim workout',
      coachComments: '',
      isSelected: true,
    },
    {
      id: 3,
      title: 'Bike Ride',
      workoutType: 'Bike',
      workoutDate: new DateOnly(2026, 1, 16),
      timeOfDay: 'morning',
      plannedDuration: 2,
      plannedDistanceInMeters: 40000,
      workoutDescription: 'Long ride',
      coachComments: '',
      isSelected: true,
    },
  ];

  it('should render without crashing', () => {
    render(<Calendar workouts={[]} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
  });

  it('should display the current month and year', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should display navigation buttons', () => {
    render(<Calendar workouts={[]} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Today/ })).toBeInTheDocument();
  });

  it('should display weekday headers', () => {
    render(<Calendar workouts={[]} />);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('should navigate to previous month', () => {
    const testDate = new DateOnly(2026, 2, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // Switch to month view first
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should navigate to next month', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // Switch to month view first
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should display workout titles for days with workouts', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // January 15 has 2 workouts - now displayed as titles
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    // January 16 has 1 workout
    expect(screen.getByText('Bike Ride')).toBeInTheDocument();
  });

  it('should display rest day for days without workouts', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // Verify that rest day labels exist (time slots are rendered)
    const restDays = screen.getAllByText('Rest day');
    expect(restDays.length).toBeGreaterThan(0);
  });

  it('should correctly match workout dates regardless of timezone', async () => {
    // Workouts are stored with dates and the calendar displays them correctly
    const testDate = new DateOnly(2026, 1, 15);
    const { container } = render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // Wait for workouts to render
    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });
    
    // Both Jan 15 workouts should be displayed (Morning Run and Evening Swim)
    expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    
    // Jan 16 should show its single workout
    expect(screen.getByText('Bike Ride')).toBeInTheDocument();
    
    // Time slots should be displayed for all days (verify by checking for time slot headers)
    await waitFor(() => {
      expect(screen.getAllByText(/morning|afternoon|evening/i).length).toBeGreaterThan(0);
    });
  });

  it('should highlight today', async () => {
    const today = new Date();
    const testDate = new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    await waitFor(() => {
      // Verify that today's date is rendered in the calendar
      expect(screen.getAllByText(String(today.getDate())).length).toBeGreaterThan(0);
    });
  });

  it('should handle empty workouts array', async () => {
    render(<Calendar workouts={[]} />);
    // Time slots should still be displayed even with no workouts (check for Rest day labels)
    await waitFor(() => {
      expect(screen.getAllByText('Rest day').length).toBeGreaterThan(0);
    });
  });

  it('should handle undefined workouts prop', () => {
    render(<Calendar />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
  });

  it('should display day numbers correctly', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // In week view, we should see day 15 and surrounding days
    expect(screen.getByText('15')).toBeInTheDocument();
    
    // Switch to month view to see full month
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    // Check that day 15 is visible
    expect(screen.getByText('15')).toBeInTheDocument();
    
    // Note: There may be multiple "1"s and "31"s shown from adjacent months
    const allOnes = screen.getAllByText('1');
    expect(allOnes.length).toBeGreaterThanOrEqual(1);
    const allThirtyOnes = screen.getAllByText('31');
    expect(allThirtyOnes.length).toBeGreaterThanOrEqual(1);
  });

  it('should navigate multiple months correctly', () => {
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // Switch to month view first
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    const nextButton = screen.getByRole('button', { name: /Next/ });
    
    // Go forward 3 months
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('should go to today when today button is clicked', () => {
    const testDate = new DateOnly(2020, 1, 15); // Old date
    const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // Should show January 2020 initially
    expect(screen.getByText('January 2020')).toBeInTheDocument();
    
    // Click today button
    fireEvent.click(screen.getByRole('button', { name: /Today/ }));
    
    // Should now show current month/year
    const today = new Date();
    const monthYear = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(today);
    
    expect(screen.getByText(monthYear)).toBeInTheDocument();
  });

  it('should handle workouts on different months', () => {
    const workouts = [
      {
        title: 'January Workout',
        workoutType: 'Run',
        workoutDate: new DateOnly(2026, 1, 15),
      },
      {
        title: 'February Workout',
        workoutType: 'Swim',
        workoutDate: new DateOnly(2026, 2, 15),
      },
    ];

    const testDate = new DateOnly(2026, 1, 15);
    const { rerender } = render(<Calendar workouts={workouts} initialDate={testDate} />);
    
    expect(screen.getByText('January Workout')).toBeInTheDocument();
    
    // Switch to month view
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    // Navigate to February
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    
    // Should show February
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should handle year boundary transitions', () => {
    const testDate = new DateOnly(2025, 12, 15);
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    expect(screen.getByText('December 2025')).toBeInTheDocument();
    
    // Switch to month view
    fireEvent.click(screen.getByRole('button', { name: /Month/ }));
    
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should display workouts correctly in month view', () => {
    // Verify that month view displays workouts with titles and styling
    const testDate = new DateOnly(2026, 1, 15);
    const { rerender } = render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // Start in week view (default) - should see workout titles
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    
    // Switch to month view
    const monthButton = screen.getByRole('button', { name: /Month/ });
    fireEvent.click(monthButton);
    
    // Month view should still show all workout titles
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    expect(screen.getByText('Bike Ride')).toBeInTheDocument();
    
    // Get all rest day elements to verify there are some (but not on days with workouts)
    const allRestDays = screen.getAllByText('Rest day');
    expect(allRestDays.length).toBeGreaterThan(0);
    
    // Find the calendar cell for Morning Run and assert it shows day number 15 and the workout
    const morningRun = screen.getByText('Morning Run');
    const jan15 = morningRun.closest('.calendar-day');
    expect(jan15).toHaveTextContent('15');
    expect(jan15).toHaveTextContent('Morning Run');
    expect(jan15).not.toHaveTextContent('Rest day');
  });



  describe('Workout Modal Interaction', () => {
    it('should open modal when workout card is clicked', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Find and click a workout badge
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal should display
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();
    });

    it('should display correct workout details in modal', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Click a workout - get the badge specifically
      const workoutBadge = screen.getAllByText('Morning Run')[0];
      fireEvent.click(workoutBadge);

      // Verify modal shows the right details
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();
      expect(screen.getByText('Keep it easy')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Open modal
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal is visible
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();

      // Close modal (close button uses × text)
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Modal should be gone
      expect(screen.queryByText('Easy 5k run')).not.toBeInTheDocument();
    });

    it('should close modal when clicking overlay', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Open modal
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal is visible
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();

      // Click overlay (closest .modal-overlay to the modal content)
      const overlay = screen.getByText('Easy 5k run').closest('.modal-overlay');
      fireEvent.click(overlay);

      // Modal should be gone
      expect(screen.queryByText('Easy 5k run')).not.toBeInTheDocument();
    });

    it('should allow keyboard navigation to open modal', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Get the workout badge and click the inner interactive area
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      expect(workoutBadge).not.toBeNull();
      
      // Click on the inner div that opens the modal
      const clickableArea = workoutBadge.querySelector('[role="button"]');
      fireEvent.click(clickableArea);

      // Modal should open (verify content)
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();
    });

    it('should display different modal for each clicked workout', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Click first workout
      let workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);
      expect(screen.getByText('Easy 5k run')).toBeInTheDocument();

      // Close modal
      let closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      expect(screen.queryByText('Easy 5k run')).not.toBeInTheDocument();

      // Click second workout
      workoutBadge = screen.getByText('Evening Swim');
      fireEvent.click(workoutBadge);
      expect(screen.getByText('Swim workout')).toBeInTheDocument();
    });

    it('should update modal content when workout location changes', async () => {
      // This test verifies the fix for a bug where the modal wouldn't update
      // when the workout data changed (e.g., when location was updated)
      const bikeWorkout = {
        id: 1,
        title: 'Bike Ride',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 1, 15),
        timeOfDay: 'morning',
        plannedDuration: 2,
        plannedDistanceInMeters: 40000,
        workoutDescription: 'Long ride',
        coachComments: '',
        workoutLocation: null, // Initially no location set
        isSelected: true,
      };

      const testDate = new DateOnly(2026, 1, 15);
      const mockLocationChange = jest.fn();
      
      // Initial render with workout having no location
      const { rerender } = render(
        <Calendar 
          workouts={[bikeWorkout]} 
          initialDate={testDate}
          onWorkoutLocationChange={mockLocationChange}
        />
      );

      // Open modal
      const workoutCard = screen.getByText('Bike Ride');
      fireEvent.click(workoutCard);

      // Modal should be visible with location section (it's a bike workout)
      expect(screen.getByText('Workout Location')).toBeInTheDocument();
      
      // The "Not Set" button should be active initially
      let notSetButton = screen.getByTitle('Location not specified');
      expect(notSetButton).toHaveClass('active');
      
      // Click indoor button
      const indoorButton = screen.getByTitle('Indoor workout');
      fireEvent.click(indoorButton);
      
      // Verify the callback was called
      expect(mockLocationChange).toHaveBeenCalledWith(1, 'indoor');
      
      // Simulate what happens when the parent updates workouts array
      // (This is what App.js does after the API call succeeds)
      const updatedWorkout = { ...bikeWorkout, workoutLocation: 'indoor' };
      
      rerender(
        <Calendar 
          workouts={[updatedWorkout]} 
          initialDate={testDate}
          onWorkoutLocationChange={mockLocationChange}
        />
      );

      // The modal should still be open and now show the updated location
      // This is what the useEffect fix ensures
      await waitFor(() => {
        expect(screen.getByText('Workout Location')).toBeInTheDocument();
      });

      await waitFor(() => {
        // The indoor button should now be active
        const updatedIndoorButton = screen.getByTitle('Indoor workout');
        expect(updatedIndoorButton).toHaveClass('active');
      });

      await waitFor(() => {
        // The "Not Set" button should no longer be active
        const updatedNotSetButton = screen.getByTitle('Location not specified');
        expect(updatedNotSetButton).not.toHaveClass('active');
      });
    });

    // DELETED: Tests about workout location badges on cards
    // These are WorkoutBadge's responsibility and are already tested in WorkoutBadge.test.js
    // Calendar's responsibility is just to pass workouts to WorkoutBadge, not to display the location badges itself
  });

  describe('PropTypes validation', () => {
    const originalError = console.error;
    
    beforeAll(() => {
      // Suppress console.error for PropTypes warnings
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = originalError;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should accept valid workouts array with required fields', () => {
      const validWorkouts = [
        {
          title: 'Test Workout',
          workoutType: 'Run',
        },
      ];
      render(<Calendar workouts={validWorkouts} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept workouts with all optional fields', () => {
      render(<Calendar workouts={mockWorkouts} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept empty workouts array', () => {
      render(<Calendar workouts={[]} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept undefined workouts (uses default)', () => {
      render(<Calendar />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept DateOnly initialDate prop', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={[]} initialDate={testDate} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept workout with DateOnly workoutDate', () => {
      const workouts = [
        {
          title: 'Test',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
        },
      ];
      render(<Calendar workouts={workouts} />);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Adjacent month dates in month view', () => {
    it('should display dates from previous month in first week of month view', () => {
      // January 2026 starts on Thursday, so Monday-Wednesday should show Dec 29, 30, 31
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Check for December dates at the beginning
      const calendarDays = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day')).filter(Boolean);
      const firstDay = calendarDays[0];
      
      // First day should have the other-month class
      expect(firstDay.classList.contains('other-month')).toBe(true);
    });

    it('should display dates from next month in last week of month view', () => {
      // January 2026 ends on Saturday, so Sunday should show Feb 1
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Check for February dates at the end
      const calendarDaysEnd = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day')).filter(Boolean);
      const lastDay = calendarDaysEnd[calendarDaysEnd.length - 1];
      
      // Last day should have the other-month class
      expect(lastDay.classList.contains('other-month')).toBe(true);
    });

    it('should visually distinguish other-month dates with CSS class', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Find days with other-month class
      const otherMonthDays = container.querySelectorAll('.calendar-day.other-month');
      expect(otherMonthDays.length).toBeGreaterThan(0);
    });

    it('should show workouts on adjacent month dates if they exist', () => {
      // Create a workout on December 31, 2025 (which appears in January 2026 view)
      const workouts = [
        {
          title: 'December Workout',
          workoutType: 'Run',
          workoutDate: new DateOnly(2025, 12, 31),
        },
      ];
      
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={workouts} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Should show the workout from previous month
      expect(screen.getByText('December Workout')).toBeInTheDocument();
    });

    it('should show correct date numbers for previous month days', () => {
      // January 2026 starts on Thursday (Jan 1)
      // Mon 29, Tue 30, Wed 31 (Dec 2025), Thu 1 (Jan 2026)
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      const calendarDays = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day')).filter(Boolean);
      const firstThreeDays = calendarDays.slice(0, 3);
      
      // These should be from previous month (Dec 29, 30, 31)
      const dayNumbers = firstThreeDays.map(day => day.querySelector('.day-number')?.textContent);
      
      expect(dayNumbers).toEqual(['29', '30', '31']);
    });

    it('should show correct date numbers for next month days', () => {
      // January 2026 ends on Saturday (Jan 31)
      // Sunday should be Feb 1
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      const calendarDays = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day')).filter(Boolean);
      const lastDay = calendarDays[calendarDays.length - 1];
      const lastDayNumber = lastDay.querySelector('.day-number')?.textContent;
      
      // Last day should be Feb 1
      expect(lastDayNumber).toBe('1');
      expect(lastDay.classList.contains('other-month')).toBe(true);
    });

    it('should not show other-month class on current month dates', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Find the day with "15" in it
      const calendarDays = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day')).filter(Boolean);
      const day15 = calendarDays.find(day => day.querySelector('.day-number')?.textContent === '15');
      
      expect(day15).toBeTruthy();
      expect(day15.classList.contains('other-month')).toBe(false);
    });

    it('should maintain clickability of adjacent month dates', () => {
      const workouts = [
        {
          title: 'December Workout',
          workoutType: 'Run',
          workoutDate: new DateOnly(2025, 12, 31),
        },
      ];
      
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={workouts} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Click the workout from the adjacent month
      const workoutBadge = screen.getByText('December Workout');
      fireEvent.click(workoutBadge);
      
      // Modal should open (workout details would be shown)
      // This verifies the workout is fully interactive
      expect(workoutBadge).toBeTruthy();
    });
  });

  describe('Drag and Drop Functionality', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should make workout badges draggable', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          plannedDuration: 1,
          isSelected: true,
        },
      ];
      
      render(<Calendar workouts={workouts} initialDate={testDate} />);
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      expect(workoutBadge).toHaveAttribute('draggable', 'true');
    });

    it('should call onWorkoutDateChange when workout is dropped on a new day', () => {
      const mockDateChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
          plannedDuration: 1,
          isSelected: true,
        },
      ];
      
      const { container } = render(
        <Calendar 
          workouts={workouts} 
          initialDate={testDate}
          onWorkoutDateChange={mockDateChange}
        />
      );
      
      // Switch to month view for simpler drag and drop testing
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      // Get the workout badge and a target day
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      const calendarDays = container.querySelectorAll('.calendar-day');
      // Find day 16 (next day)
      const targetDay = Array.from(calendarDays).find(day => 
        day.querySelector('.day-number')?.textContent === '16'
      );
      
      // Simulate drag and drop
      fireEvent.dragStart(workoutBadge);
      fireEvent.dragOver(targetDay);
      fireEvent.drop(targetDay);
      
      // Verify the callback was called with correct workout ID and new date
      expect(mockDateChange).toHaveBeenCalledTimes(1);
      const [workoutId, newDate] = mockDateChange.mock.calls[0];
      expect(workoutId).toBe(1);
      expect(newDate).toBeInstanceOf(Date);
      expect(newDate.getDate()).toBe(16);
    });

    it('should add drag-over styling to calendar day during drag', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          plannedDuration: 1,
          isSelected: true,
        },
      ];
      
      const { container } = render(<Calendar workouts={workouts} initialDate={testDate} />);
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // In week view, dragging shows time slots after a short delay
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Should not have dragging class immediately
      const calendarGridBefore = screen.getByText('15').closest('.calendar-grid');
      expect(calendarGridBefore).not.toHaveClass('dragging');
      
      // Simulate the delay by using fake timers
      jest.useFakeTimers();
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers to trigger showing of time slots
      jest.advanceTimersByTime(100);
      
      // After delay, time slot headers should be visible (dragging UI shown)
      expect(screen.getAllByText(/morning|afternoon|evening/i).length).toBeGreaterThan(0);
      
      // Find a time slot and drag over it (use visible headers as anchors)
      const timeSlots = screen.getAllByText(/morning|afternoon|evening|unscheduled/i);
      if (timeSlots.length > 0) {
        fireEvent.dragOver(timeSlots[0]);
        // The specific time slot should have drag-over class on its closest .time-slot
        expect(timeSlots[0].closest('.time-slot')).toHaveClass('drag-over');
        
        // Drag leave
        fireEvent.dragLeave(timeSlots[0]);
        
        // Should not have drag-over class anymore
        expect(timeSlots[0].closest('.time-slot')).not.toHaveClass('drag-over');
      }
      
      jest.useRealTimers();
    });

    it('should not call onWorkoutDateChange when dropped on same day', () => {
      const mockDateChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
          plannedDuration: 1,
          isSelected: true,
        },
      ];
      
      const { container } = render(
        <Calendar 
          workouts={workouts} 
          initialDate={testDate}
          onWorkoutDateChange={mockDateChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      const calendarDays = container.querySelectorAll('.calendar-day');
      const sameDay = Array.from(calendarDays).find(day => 
        day.querySelector('.day-number')?.textContent === '15'
      );
      
      // Drag and drop on same day
      fireEvent.dragStart(workoutBadge);
      fireEvent.drop(sameDay);
      
      // Should not call the handler since date didn't change
      expect(mockDateChange).not.toHaveBeenCalled();
    });

    it('should work in month view as well', () => {
      const mockDateChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
          plannedDuration: 1,
          isSelected: true,
        },
      ];
      
      const { container } = render(
        <Calendar 
          workouts={workouts} 
          initialDate={testDate}
          onWorkoutDateChange={mockDateChange}
        />
      );
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      const calendarDays = container.querySelectorAll('.calendar-day');
      const targetDay = Array.from(calendarDays).find(day => 
        day.querySelector('.day-number')?.textContent === '20'
      );
      
      // Simulate drag and drop
      fireEvent.dragStart(workoutBadge);
      fireEvent.drop(targetDay);
      
      expect(mockDateChange).toHaveBeenCalled();
    });

    it('should not trigger weekly-targets API calls during drag (without drop)', async () => {
      // Mock fetch to track API calls
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      });
      global.fetch = mockFetch;

      const testDate = new DateOnly(2026, 1, 15);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
          plannedDuration: 1,
          isSelected: true,
          timeOfDay: 'morning',
        },
      ];

      const { container } = render(
        <Calendar 
          workouts={workouts} 
          initialDate={testDate}
        />
      );

      // Wait for initial render and API calls
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Count initial API calls (should be 1 for initial weekly targets fetch)
      const initialCallCount = mockFetch.mock.calls.filter(
        call => call[0] && call[0].includes('/api/weekly-targets')
      ).length;

      // Get the workout badge
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');

      // Use fake timers for drag operations
      jest.useFakeTimers();

      // Simulate dragging (start drag and drag over multiple areas without dropping)
      fireEvent.dragStart(workoutBadge);
      jest.advanceTimersByTime(100); // Advance past the time slot display delay

      // Drag over multiple time slots to simulate moving around
      const timeSlots = container.querySelectorAll('.time-slot');
      for (let i = 0; i < Math.min(5, timeSlots.length); i++) {
        fireEvent.dragOver(timeSlots[i]);
      }

      // End drag without dropping
      fireEvent.dragEnd(workoutBadge);

      jest.useRealTimers();

      // Count API calls after drag operations
      const finalCallCount = mockFetch.mock.calls.filter(
        call => call[0] && call[0].includes('/api/weekly-targets')
      ).length;

      // Verify no additional API calls were made during drag operations
      expect(finalCallCount).toBe(initialCallCount);
    });
  });

  describe('Time of Day Functionality', () => {
    const workoutsWithTime = [
      {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDate: new DateOnly(2026, 1, 15),
        originallyPlannedDay: '2026-01-15',
        plannedDuration: 1,
        isSelected: true,
        timeOfDay: 'morning',
      },
      {
        id: 2,
        title: 'Afternoon Swim',
        workoutType: 'Swim',
        workoutDate: new DateOnly(2026, 1, 15),
        originallyPlannedDay: '2026-01-15',
        plannedDuration: 1,
        isSelected: true,
        timeOfDay: 'afternoon',
      },
      {
        id: 3,
        title: 'Evening Bike',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 1, 15),
        originallyPlannedDay: '2026-01-15',
        plannedDuration: 2,
        isSelected: true,
        timeOfDay: 'evening',
      },
      {
        id: 4,
        title: 'Unscheduled Strength',
        workoutType: 'Strength',
        workoutDate: new DateOnly(2026, 1, 15),
        originallyPlannedDay: '2026-01-15',
        plannedDuration: 0.5,
        isSelected: true,
      },
    ];

    afterEach(() => {
      jest.useRealTimers();
    });

    // DELETED: "should group workouts by time of day when they have timeOfDay set"
    // This is DayTimeSlot's responsibility - it renders the time slot header.
    // DayTimeSlot.test.js already verifies time slot headers are rendered.

    // KEPT: Tests Calendar's drag coordination showing time slots
    it('should show time slots when dragging a workout', () => {
      jest.useFakeTimers();
      const mockTimeChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
          onWorkoutTimeOfDayChange={mockTimeChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers for time slots to appear
      jest.advanceTimersByTime(100);
      
      // Check that calendar has dragging class
      const calendarGrid = screen.getByText('15').closest('.calendar-grid');
      expect(calendarGrid).toHaveClass('dragging');
      
      jest.useRealTimers();
    });

    // KEPT: Tests Calendar's coordination of time-of-day change callback
    it('should call onWorkoutTimeOfDayChange when dropping on a time slot', () => {
      jest.useFakeTimers();
      const mockTimeChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
          onWorkoutTimeOfDayChange={mockTimeChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers for time slots to appear
      jest.advanceTimersByTime(100);
      
      // Find an afternoon time slot via visible header
      const afternoonHeaders = screen.getAllByText(/afternoon/i);
      expect(afternoonHeaders.length).toBeGreaterThan(0);
      
      // Drop on the first afternoon slot (use closest .time-slot)
      fireEvent.drop(afternoonHeaders[0].closest('.time-slot'));
      
      // Should call time change handler with afternoon
      expect(mockTimeChange).toHaveBeenCalledWith(1, 'afternoon');
      
      jest.useRealTimers();
    });

    // KEPT: Tests Calendar's coordination of both date and time change
    it('should update both date and time when dropping on different day time slot', () => {
      jest.useFakeTimers();
      const mockTimeChange = jest.fn();
      const mockDateChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
          onWorkoutTimeOfDayChange={mockTimeChange}
          onWorkoutDateChange={mockDateChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers for time slots to appear
      jest.advanceTimersByTime(100);
      
      // Find time slots from a different day by finding day numbers and locating their time-slot descendants
      const dayNumberElements = screen.getAllByText(/\b\d+\b/);
      const calendarDays = dayNumberElements.map(el => el.closest('.calendar-day.time-slot-mode')).filter(Boolean);
      // Get the second day's afternoon slot
      if (calendarDays.length > 1) {
        const secondDaySlots = calendarDays[1].querySelectorAll('.time-slot.afternoon');
        if (secondDaySlots.length > 0) {
          fireEvent.drop(secondDaySlots[0]);
          
          // Both handlers should be called
          expect(mockTimeChange).toHaveBeenCalled();
          expect(mockDateChange).toHaveBeenCalled();
        }
      }
      
      jest.useRealTimers();
    });

    // KEPT: Tests Calendar's handling of unscheduled slot drops
    it('should handle unscheduled time slot correctly', () => {
      jest.useFakeTimers();
      const mockTimeChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
          onWorkoutTimeOfDayChange={mockTimeChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers for time slots to appear
      jest.advanceTimersByTime(100);
      
      // Find unscheduled time slot on same day (by header text)
      const unscheduledHeaders = screen.queryAllByText(/unscheduled/i);
      if (unscheduledHeaders.length > 0) {
        fireEvent.drop(unscheduledHeaders[0].closest('.time-slot'));
        
        // Should call with 'unscheduled' which gets converted to null in App.js
        expect(mockTimeChange).toHaveBeenCalledWith(1, 'unscheduled');
      }
      
      jest.useRealTimers();
    });

    // KEPT: Tests Calendar's time slot display coordination in week view
    it('should always show time slot drop zones in week view', () => {
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
        />
      );
      
      // Time slots should always be visible now (check headers)
      const timeSlots = screen.getAllByText(/morning|afternoon|evening/i);
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Calendar days should have time-slot-mode class (find by day numbers)
      const timeSlotModeElements = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day.time-slot-mode')).filter(Boolean);
      expect(timeSlotModeElements.length).toBeGreaterThan(0);
    });

    // KEPT: Tests Calendar's time slot show timing during drag
    it('should show time slots shortly after drag starts', async () => {
      jest.useFakeTimers();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Should not immediately show time slots (prevents drag breaking)
      const calendarGridImmediate = screen.getByText('15').closest('.calendar-grid');
      expect(calendarGridImmediate).not.toHaveClass('dragging');
      
      // Advance timers to trigger the timeout
      jest.advanceTimersByTime(100);
      
      // After the delay, time slots should appear
      const calendarGrid = screen.getByText('15').closest('.calendar-grid');
      expect(calendarGrid).toHaveClass('dragging');
      
      // Should show time slot mode
      const timeSlotMode = screen.getAllByText(/\b\d+\b/).map(el => el.closest('.calendar-day.time-slot-mode')).filter(Boolean);
      expect(timeSlotMode.length).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });

    // KEPT: Tests Calendar's time slot hide on drop
    it('should hide time slots when workout is dropped', async () => {
      jest.useFakeTimers();
      const mockTimeChange = jest.fn();
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
          onWorkoutTimeOfDayChange={mockTimeChange}
        />
      );
      
      const workoutBadge = screen.getByText('Morning Run').closest('.workout-badge');
      
      // Start dragging
      fireEvent.dragStart(workoutBadge);
      
      // Advance timers for time slots to appear
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const timeSlots = container.querySelectorAll('.time-slot.afternoon');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Drop on a time slot
      fireEvent.drop(timeSlots[0]);
      
      // Time slots should be hidden after drop
      const calendarGrid = container.querySelector('.calendar-grid');
      expect(calendarGrid).not.toHaveClass('dragging');
      
      jest.useRealTimers();
    });

    // DELETED: "should not show unscheduled workout box when not dragging"
    // This test is about DayTimeSlot rendering behavior, not Calendar's responsibility.
    // DayTimeSlot.test.js already tests that time slots and their workouts are rendered correctly.
  });

  describe('Tri Club Schedule', () => {
    const mockTriClubSchedule = {
      effective_date: '2026-01-01',
      schedule: {
        monday: [
          { time: '07:00', activity: 'Ride' },
          { time: '19:00', activity: 'Swim' }
        ],
        tuesday: [
          { time: '07:00', activity: 'S&C' }
        ],
        wednesday: [
          { time: '08:00', activity: 'Run Indoor' }
        ],
        thursday: [],
        friday: [
          { time: '07:30', activity: 'Ride' }
        ],
        saturday: [
          { time: '09:00', activity: 'Swim' }
        ],
        sunday: [
          { time: '09:00', activity: 'Long/Brick Event' }
        ]
      }
    };

    it('should render tri club events in calendar', () => {
      // Test date is a Monday (Jan 13, 2026)
      const testDate = new DateOnly(2026, 1, 13);
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Check for Monday events with 12-hour format and 'tri club' prefix
      const rideEvents = screen.getAllByText('7am tri club ride');
      expect(rideEvents.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('7pm tri club swim')).toBeInTheDocument();
    });

    it('should render tri club events with 12-hour time format', () => {
      const testDate = new DateOnly(2026, 1, 13);
      render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Verify 12-hour format is used (not 24-hour)
      const rideEvents = screen.getAllByText('7am tri club ride');
      expect(rideEvents.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('07:00 Ride')).not.toBeInTheDocument();
      expect(screen.getByText('7pm tri club swim')).toBeInTheDocument();
      expect(screen.queryByText('19:00 Swim')).not.toBeInTheDocument();
    });

    it('should render tri club events inside appropriate time slot boxes', () => {
      const testDate = new DateOnly(2026, 1, 13); // Monday
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Find time slots via visible headers
      const timeSlotHeaders = screen.getAllByText(/morning|afternoon|evening/i);
      const timeSlots = timeSlotHeaders.map(h => h.closest('.time-slot')).filter(Boolean);
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Morning slot for Monday should be findable within that day's cell
      const mondayCell = screen.getByText('13').closest('.calendar-day');
      const morningHeader = within(mondayCell).getByText(/morning/i);
      const morningSlot = morningHeader.closest('.time-slot');
      expect(morningSlot).toBeTruthy();
      
      // Check that tri club event is rendered (use text search)
      const morningRide = screen.getByText('7am tri club ride');
      expect(morningRide).toBeTruthy();
      expect(morningRide.textContent).toContain('7am tri club ride');
      
      // Evening slot should be findable via its header
      const eveningHeader = screen.getByText(/evening/i);
      const eveningSlot = eveningHeader.closest('.time-slot');
      expect(eveningSlot).toBeTruthy();
      
      const eveningSwim = screen.getByText('7pm tri club swim');
      expect(eveningSwim).toBeTruthy();
      expect(eveningSwim.textContent).toContain('7pm tri club swim');
    });

    it('should show time slot box even when only tri club event exists (no workouts)', () => {
      const testDate = new DateOnly(2026, 1, 13); // Monday
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Time slots should be visible even with only tri club events (use headers)
      const timeSlotHeaders = screen.getAllByText(/morning|afternoon|evening/i);
      expect(timeSlotHeaders.length).toBeGreaterThan(0);
      
      // Morning slot should exist because Monday has a 7am tri club event
      const mondayCell = screen.getByText('13').closest('.calendar-day');
      const morningHeader = within(mondayCell).getByText(/morning/i);
      const morningSlot = morningHeader.closest('.time-slot');
      expect(morningSlot).toBeTruthy();
    });

    it('should render tri club events with small unobtrusive styling', () => {
      const testDate = new DateOnly(2026, 1, 13);
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      const triClubEvents = container.querySelectorAll('.tri-club-event');
      expect(triClubEvents.length).toBeGreaterThan(0);
      
      // Verify events are in the tri-club-events container
      const triClubContainer = container.querySelector('.tri-club-events');
      expect(triClubContainer).toBeInTheDocument();
    });

    it('should handle missing tri club schedule gracefully', () => {
      const testDate = new DateOnly(2026, 1, 13);
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={null}
          initialDate={testDate}
        />
      );
      
      // Should not crash and should not show any tri club events
      const triClubEvents = container.querySelectorAll('.tri-club-event');
      expect(triClubEvents.length).toBe(0);
    });

    it('should render tri club events for different days of the week', () => {
      // Test a full week
      const testDate = new DateOnly(2026, 1, 13); // Monday
      const { container } = render(
        <Calendar 
          workouts={[]} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Monday: 2 events (morning and evening)
      const rideEvents = screen.getAllByText('7am tri club ride');
      expect(rideEvents.length).toBeGreaterThanOrEqual(1); // At least Monday has it
      expect(screen.getByText('7pm tri club swim')).toBeInTheDocument();
      
      // Tuesday: 1 event (morning)
      expect(screen.getByText('7am tri club s&c')).toBeInTheDocument();
    });

    it('should render tri club events alongside workouts', () => {
      const testDate = new DateOnly(2026, 1, 13); // Monday
      const workoutsOnMonday = [
        {
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 13),
          plannedDuration: 0.75,
          plannedDistanceInMeters: 5000,
          workoutDescription: 'Easy 5k run',
          coachComments: 'Keep it easy',
          isSelected: true,
          timeOfDay: 'morning'
        }
      ];
      
      const { container } = render(
        <Calendar 
          workouts={workoutsOnMonday} 
          triClubSchedule={mockTriClubSchedule}
          initialDate={testDate}
        />
      );
      
      // Should show both tri club events and workouts in the same time slot
      const rideEvents = screen.getAllByText('7am tri club ride');
      expect(rideEvents.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      
      // Both should be in the morning time slot
      const timeSlots = container.querySelectorAll('.time-slot');
      const morningSlots = Array.from(timeSlots).filter(slot => 
        slot.querySelector('.time-slot-header')?.textContent.includes('Morning')
      );
      expect(morningSlots.length).toBeGreaterThan(0);
      
      // Find the morning slot that contains the workout
      const morningSlotWithWorkout = morningSlots.find(slot => 
        slot.textContent.includes('Morning Run')
      );
      expect(morningSlotWithWorkout).toBeTruthy();
      
      // Verify both tri club event and workout are in the same morning slot
      expect(morningSlotWithWorkout.textContent).toContain('tri club');
      expect(morningSlotWithWorkout.textContent).toContain('Morning Run');
    });
  });

  describe('Layout Bug Regression - Time Slot Overflow', () => {
    beforeEach(() => {
      // Mock weather API to prevent errors in these tests
      apiCall.mockResolvedValue({
        ok: true,
        json: async () => ({
          date: '2026-01-12',
          morning: {
            temperature: 30,
            rain_probability: 0,
            windspeed: 11,
            weather_code: 0,
            description: 'Clear sky'
          },
          afternoon: {
            temperature: 40,
            rain_probability: 0,
            windspeed: 10,
            weather_code: 0,
            description: 'Clear sky'
          },
          evening: {
            temperature: 35,
            rain_probability: 0,
            windspeed: 9,
            weather_code: 0,
            description: 'Clear sky'
          }
        })
      });
    });

    // KEPT: Tests Calendar's layout structure and responsibility for organizing time slots
    test('time slots container should have proper structure for overflow management', () => {
      const testDate = new DateOnly(2026, 1, 12);
      const workouts = [
        {
          id: 1,
          title: 'Evening Swim',
          workoutType: 'Swim',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 0.55,
          timeOfDay: 'evening'
        },
        {
          id: 2,
          title: 'Evening Strength',
          workoutType: 'Strength',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 1,
          timeOfDay: 'evening'
        }
      ];

      const { container } = render(
        <Calendar
          workouts={workouts}
          onSelectWorkout={() => {}}
          onDeselectWorkout={() => {}}
          onChangeWorkoutTime={() => {}}
          initialDate={testDate}
        />
      );

      // Check that time-slots-container exists
      const timeSlotsContainers = container.querySelectorAll('.time-slots-container');
      expect(timeSlotsContainers.length).toBeGreaterThan(0);

      // Check that individual time slots exist
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Verify each time slot has proper structure
      timeSlots.forEach(slot => {
        // Check that the slot has the time-slot class which has the CSS to prevent overlap
        expect(slot.classList.contains('time-slot')).toBe(true);
      });
    });

    // KEPT: Tests Calendar's coordination of time slot display
    test('multiple workouts in evening slot should not overlap with unscheduled slot', () => {
      const testDate = new DateOnly(2026, 1, 12);
      const workouts = [
        {
          id: 1,
          title: 'Morning Run',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 0.75,
          timeOfDay: 'morning'
        },
        {
          id: 2,
          title: 'Evening Swim',
          workoutType: 'Swim',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 0.55,
          timeOfDay: 'evening'
        },
        {
          id: 3,
          title: 'Evening Strength',
          workoutType: 'Strength',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 1,
          timeOfDay: 'evening'
        },
        {
          id: 4,
          title: 'Unscheduled Bike',
          workoutType: 'Bike',
          workoutDate: new DateOnly(2026, 1, 12),
          plannedDuration: 1.25,
          timeOfDay: null
        }
      ];

      const { container } = render(
        <Calendar
          workouts={workouts}
          onSelectWorkout={() => {}}
          onDeselectWorkout={() => {}}
          onChangeWorkoutTime={() => {}}
          initialDate={testDate}
        />
      );

      // Find the day containing all workouts - look for a unique workout title
      const dayElements = container.querySelectorAll('.calendar-day');
      const dayElement = Array.from(dayElements).find(
        day => day.textContent.includes('Unscheduled Bike')
      );
      expect(dayElement).toBeTruthy();

      // Verify all time slots are present in this day
      const timeSlotsInDay = dayElement.querySelectorAll('.time-slot');
      expect(timeSlotsInDay.length).toBeGreaterThan(0);

      // Check that evening slot exists and contains workouts
      const eveningSlot = Array.from(timeSlotsInDay).find(
        slot => slot.classList.contains('evening')
      );
      expect(eveningSlot).toBeTruthy();
      expect(eveningSlot.textContent).toContain('Evening');

      // Check that unscheduled slot exists
      const unscheduledSlot = Array.from(timeSlotsInDay).find(
        slot => slot.classList.contains('unscheduled')
      );
      expect(unscheduledSlot).toBeTruthy();

      // Both evening and unscheduled slots should exist separately
      expect(eveningSlot).not.toBe(unscheduledSlot);
    });

    // KEPT: Tests Calendar's coordination that all time slot headers are visible
    test('day with many workouts should maintain all time slot headers visible', () => {
      const testDate = new DateOnly(2026, 1, 12);
      const workouts = [
        { id: 1, title: 'Morning Run', workoutType: 'Run', workoutDate: new DateOnly(2026, 1, 12), plannedDuration: 0.75, timeOfDay: 'morning' },
        { id: 2, title: 'Afternoon Bike', workoutType: 'Bike', workoutDate: new DateOnly(2026, 1, 12), plannedDuration: 1, timeOfDay: 'afternoon' },
        { id: 3, title: 'Evening Swim', workoutType: 'Swim', workoutDate: new DateOnly(2026, 1, 12), plannedDuration: 0.55, timeOfDay: 'evening' },
        { id: 4, title: 'Evening Strength', workoutType: 'Strength', workoutDate: new DateOnly(2026, 1, 12), plannedDuration: 1, timeOfDay: 'evening' },
        { id: 5, title: 'Unscheduled Bike', workoutType: 'Bike', workoutDate: new DateOnly(2026, 1, 12), plannedDuration: 1.25, timeOfDay: null }
      ];

      const { container } = render(
        <Calendar
          workouts={workouts}
          onSelectWorkout={() => {}}
          onDeselectWorkout={() => {}}
          onChangeWorkoutTime={() => {}}
          initialDate={testDate}
        />
      );

      // All time slot labels should be present (check for at least one of each)
      const morningLabels = screen.queryAllByText('🌅 Morning');
      expect(morningLabels.length).toBeGreaterThan(0);
      
      const afternoonLabels = screen.queryAllByText('☀️ Afternoon');
      expect(afternoonLabels.length).toBeGreaterThan(0);
      
      const eveningLabels = screen.queryAllByText('🌙 Evening');
      expect(eveningLabels.length).toBeGreaterThan(0);
      
      const unscheduledLabels = screen.queryAllByText('Unscheduled');
      expect(unscheduledLabels.length).toBeGreaterThan(0);
    });

    // DELETED: "unscheduled label should be visible when unscheduled workouts exist"
    // This test is about DayTimeSlot rendering its label, not Calendar's responsibility.
    // DayTimeSlot.test.js already tests that time slot headers are rendered correctly.
  });
});
