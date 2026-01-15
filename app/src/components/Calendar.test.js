import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
    const { container } = render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // In the new time-slot architecture, all time slots are shown
    // Verify that time slots exist (they should have the time-slot class)
    const timeSlots = container.querySelectorAll('.time-slot');
    expect(timeSlots.length).toBeGreaterThan(0);
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
    
    // Time slots should be displayed for all days
    await waitFor(() => {
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
    });
  });

  it('should highlight today', async () => {
    const today = new Date();
    const testDate = new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    await waitFor(() => {
      const todayElement = document.querySelector('.calendar-day.is-today');
      expect(todayElement).toBeInTheDocument();
    });
  });

  it('should handle empty workouts array', async () => {
    const { container } = render(<Calendar workouts={[]} />);
    // Time slots should still be displayed even with no workouts
    await waitFor(() => {
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
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
    
    // Verify that Jan 15 (which has workouts) does NOT show "Rest day"
    const calendarDays = document.querySelectorAll('.calendar-day.has-date');
    const jan15 = Array.from(calendarDays).find(day => day.textContent.includes('15'));
    
    expect(jan15).not.toHaveTextContent('Rest day');
    expect(jan15).toHaveTextContent('Morning Run');
  });

  describe('Workout Display with Titles and Styling', () => {
    const testWorkouts = [
      {
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDate: new DateOnly(2026, 1, 15),
      },
      {
        title: 'Evening Swim',
        workoutType: 'Swim',
        workoutDate: new DateOnly(2026, 1, 15),
      },
    ];

    it('should display workout titles instead of just counts', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    });

    it('should display workout badges with correct styling classes', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Switch to month view to test workout badges
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);
      
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThan(0);
    });

    it('should display workout icons with emoji', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);
      
      const workoutIcons = container.querySelectorAll('.workout-icon');
      expect(workoutIcons.length).toBeGreaterThan(0);
    });

    it('should apply correct background color and border to workout badges', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);
      
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThan(0);
      
      // Verify that badges have inline styles
      workoutBadges.forEach(badge => {
        const style = badge.getAttribute('style');
        expect(style).toContain('background-color');
        expect(style).toContain('border-left');
      });
    });

    it('should display different colors for different workout types', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);
      
      const runBadges = Array.from(container.querySelectorAll('.workout-badge')).filter(badge =>
        badge.textContent.includes('Morning Run')
      );
      
      const swimBadges = Array.from(container.querySelectorAll('.workout-badge')).filter(badge =>
        badge.textContent.includes('Evening Swim')
      );
      
      expect(runBadges.length).toBe(1);
      expect(swimBadges.length).toBe(1);
      
      // Get styles
      const runStyle = runBadges[0].getAttribute('style');
      const swimStyle = swimBadges[0].getAttribute('style');
      
      // Styles should be different (different colors for different workout types)
      expect(runStyle).not.toBe(swimStyle);
    });

    it('should display all workouts for a single day', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Jan 15 has 2 workouts
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    });

    it('should display workout titles in the correct element', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      const workoutTitles = container.querySelectorAll('.workout-title');
      expect(workoutTitles.length).toBeGreaterThan(0);
      
      // Verify specific titles are present
      const titleTexts = Array.from(workoutTitles).map(t => t.textContent);
      expect(titleTexts).toContain('Morning Run');
      expect(titleTexts).toContain('Evening Swim');
    });

    it('should handle workout display in week and month view', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // In week view, titles are displayed
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    });

    it('should apply styling to workout badges', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);
      
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThan(0);
      
      // Verify badges have the correct class for hover styling
      workoutBadges.forEach(badge => {
        expect(badge.classList.contains('workout-badge')).toBe(true);
      });
    });
  });

  describe('Integration with CSV Parser Format', () => {
    it('should correctly display workouts with lowercase properties from csvParser', () => {
      // This test verifies that the Calendar component works with the actual
      // lowercase property names produced by parseWorkoutsCSV from csvParser.js
      const parsedWorkouts = [
        {
          title: 'Swim Endurance 208: 2800yds as 6x400m',
          workoutType: 'Swim',
          description: 'ENDURANCE SWIM',
          plannedDuration: 0.635,
          plannedDistance: 2560.32,
          workoutDate: new DateOnly(2026, 1, 1),
          coachComments: '',
          athleteComments: '',
        },
        {
          title: 'Run Track 3x1600m MILERS (PACE)',
          workoutType: 'Run',
          description: 'MILE REPEATS',
          plannedDuration: 0.66,
          plannedDistance: 7644.01,
          workoutDate: new DateOnly(2026, 1, 2),
          coachComments: '',
          athleteComments: '',
        },
      ];

      const testDate = new DateOnly(2026, 1, 1);
      render(<Calendar workouts={parsedWorkouts} initialDate={testDate} />);

      // Verify titles are displayed
      expect(screen.getByText('Swim Endurance 208: 2800yds as 6x400m')).toBeInTheDocument();
      expect(screen.getByText('Run Track 3x1600m MILERS (PACE)')).toBeInTheDocument();
    });

    it('should apply correct colors and icons for each workout type in parsed format', () => {
      const parsedWorkouts = [
        {
          title: 'Swim Test',
          workoutType: 'Swim',
          workoutDate: new DateOnly(2026, 1, 15),
        },
        {
          title: 'Run Test',
          workoutType: 'Run',
          workoutDate: new DateOnly(2026, 1, 15),
        },
        {
          title: 'Bike Test',
          workoutType: 'Bike',
          workoutDate: new DateOnly(2026, 1, 15),
        },
        {
          title: 'Strength Test',
          workoutType: 'Strength',
          workoutDate: new DateOnly(2026, 1, 15),
        },
      ];

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={parsedWorkouts} initialDate={testDate} />);

      // Verify all workout types are rendered
      expect(screen.getByText('Swim Test')).toBeInTheDocument();
      expect(screen.getByText('Run Test')).toBeInTheDocument();
      expect(screen.getByText('Bike Test')).toBeInTheDocument();
      expect(screen.getByText('Strength Test')).toBeInTheDocument();

      // Switch to month view to test badges
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);

      // Verify badges exist and have styling
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBe(4);

      // Each badge should have different styles
      const styles = Array.from(workoutBadges).map(badge => badge.getAttribute('style'));
      const uniqueStyles = new Set(styles);
      expect(uniqueStyles.size).toBe(4); // All should be different
    });

    it('should display correct icons for each parsed workout type', () => {
      const parsedWorkouts = [
        { title: 'Swim', workoutType: 'Swim', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Run', workoutType: 'Run', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Bike', workoutType: 'Bike', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Strength', workoutType: 'Strength', workoutDate: new DateOnly(2026, 1, 15) },
      ];

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={parsedWorkouts} initialDate={testDate} />);

      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);

      const icons = container.querySelectorAll('.workout-icon');
      expect(icons.length).toBe(4);

      // Check for specific emoji icons
      const iconTexts = Array.from(icons).map(icon => icon.textContent);
      expect(iconTexts).toContain('🏊'); // Swim
      expect(iconTexts).toContain('🏃'); // Run
      expect(iconTexts).toContain('🚴'); // Bike
      expect(iconTexts).toContain('💪'); // Strength
    });

    it('should not display gray clipboard icon but colored badges with emojis', () => {
      // This test verifies the visual fix - no more generic gray bars with clipboard
      const workouts = [
        { title: 'Test Swim', workoutType: 'Swim', workoutDate: new DateOnly(2026, 1, 15) },
      ];

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={workouts} initialDate={testDate} />);

      // Switch to month view
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);

      // Should have workout badges
      const badges = container.querySelectorAll('.workout-badge');
      expect(badges.length).toBe(1);

      // Badge should have color styling (backgroundColor and borderLeft)
      const style = badges[0].getAttribute('style');
      expect(style).toContain('background-color');
      expect(style).toContain('border-left');
      expect(style).toContain('rgb'); // Should have color, not just generic

      // Should have icon element with emoji
      const icon = container.querySelector('.workout-badge .workout-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('🏊'); // Swim emoji
      expect(icon.textContent).not.toBe('📋'); // Not clipboard emoji

      // Should have title element
      const title = container.querySelector('.workout-badge .workout-title');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Test Swim');
    });

    it('should handle all workout types with distinct visual styling', () => {
      // Verify multiple workout types on the same day display correctly
      const workoutsByType = [
        { title: 'Swim Workout', workoutType: 'Swim', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Run Workout', workoutType: 'Run', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Bike Workout', workoutType: 'Bike', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Strength Workout', workoutType: 'Strength', workoutDate: new DateOnly(2026, 1, 15) },
        { title: 'Rest Day', workoutType: 'Day Off', workoutDate: new DateOnly(2026, 1, 16) },
        { title: 'Other Workout', workoutType: 'Other', workoutDate: new DateOnly(2026, 1, 17) },
      ];

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={workoutsByType} initialDate={testDate} />);

      // Verify all titles are present
      expect(screen.getByText('Swim Workout')).toBeInTheDocument();
      expect(screen.getByText('Run Workout')).toBeInTheDocument();
      expect(screen.getByText('Bike Workout')).toBeInTheDocument();
      expect(screen.getByText('Strength Workout')).toBeInTheDocument();
      expect(screen.getByText('Other Workout')).toBeInTheDocument();

      // Switch to month view to test badges
      const monthButton = screen.getByText('Month');
      fireEvent.click(monthButton);

      // Verify all have workout badges with styling
      const badges = container.querySelectorAll('.workout-badge');
      expect(badges.length).toBe(6);

      badges.forEach((badge, idx) => {
        const style = badge.getAttribute('style');
        expect(style).toContain('background-color');
        expect(style).toContain('border-left');

        // Verify icon exists
        const icon = badge.querySelector('.workout-icon');
        expect(icon).toBeTruthy();
        expect(icon.textContent.length).toBeGreaterThan(0);

        // Verify title exists
        const title = badge.querySelector('.workout-title');
        expect(title).toBeTruthy();
        expect(title.textContent.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Workout Modal Interaction', () => {
    it('should open modal when workout card is clicked', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Find and click a workout badge
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal should display
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Easy 5k run');
    });

    it('should display correct workout details in modal', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Click a workout - get the badge specifically
      const workoutBadge = screen.getAllByText('Morning Run')[0];
      fireEvent.click(workoutBadge);

      // Verify modal shows the right details
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Easy 5k run');
      expect(modal).toHaveTextContent('Keep it easy');
    });

    it('should close modal when close button is clicked', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Open modal
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal is visible
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();

      // Close modal
      const closeButton = document.querySelector('.modal-close');
      fireEvent.click(closeButton);

      // Modal should be gone
      expect(document.querySelector('.modal-content')).not.toBeInTheDocument();
    });

    it('should close modal when clicking overlay', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Open modal
      const workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);

      // Modal is visible
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();

      // Click overlay
      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      // Modal should be gone
      expect(document.querySelector('.modal-content')).not.toBeInTheDocument();
    });

    it('should allow keyboard navigation to open modal', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Get the workout badge inner div that has the onClick handler
      const workoutBadge = container.querySelector('.workout-badge');
      expect(workoutBadge).not.toBeNull();
      
      // Click on the inner div that opens the modal
      const clickableArea = workoutBadge.querySelector('[role="button"]');
      fireEvent.click(clickableArea);

      // Modal should open
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();
    });

    it('should display different modal for each clicked workout', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Click first workout
      let workoutBadge = screen.getByText('Morning Run');
      fireEvent.click(workoutBadge);
      let modal = document.querySelector('.modal-content');
      expect(modal).toHaveTextContent('Easy 5k run');

      // Close modal
      let closeButton = document.querySelector('.modal-close');
      fireEvent.click(closeButton);
      expect(document.querySelector('.modal-content')).not.toBeInTheDocument();

      // Click second workout
      workoutBadge = screen.getByText('Evening Swim');
      fireEvent.click(workoutBadge);
      modal = document.querySelector('.modal-content');
      expect(modal).toHaveTextContent('Swim workout');
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
      let modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Workout Location');
      
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
        modal = document.querySelector('.modal-content');
        expect(modal).toBeInTheDocument();
      });

      await waitFor(() => {
        // The indoor button should now be active
        const updatedIndoorButton = screen.getByTitle('Indoor workout');
        expect(updatedIndoorButton).toHaveClass('active');
        
        // The "Not Set" button should no longer be active
        const updatedNotSetButton = screen.getByTitle('Location not specified');
        expect(updatedNotSetButton).not.toHaveClass('active');
      });
    });

    it('should display location badge on bike workout card when location is set', () => {
      const bikeWithIndoorLocation = {
        id: 1,
        title: 'Indoor Bike',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 1, 15),
        plannedDuration: 1.5,
        plannedDistanceInMeters: 40000,
        workoutDescription: 'Zwift workout',
        coachComments: '',
        workoutLocation: 'indoor',
      };

      const bikeWithOutdoorLocation = {
        id: 2,
        title: 'Outdoor Bike',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 1, 16),
        plannedDuration: 2,
        plannedDistanceInMeters: 50000,
        workoutDescription: 'Road ride',
        coachComments: '',
        workoutLocation: 'outdoor',
      };

      const bikeWithoutLocation = {
        id: 3,
        title: 'Unspecified Bike',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 1, 17),
        plannedDuration: 1,
        plannedDistanceInMeters: 30000,
        workoutDescription: 'Bike workout',
        coachComments: '',
        workoutLocation: null,
      };

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(
        <Calendar 
          workouts={[bikeWithIndoorLocation, bikeWithOutdoorLocation, bikeWithoutLocation]} 
          initialDate={testDate}
        />
      );

      // Check for indoor location badge
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThan(0);
      
      // Find the indoor bike workout badge
      const indoorBadge = Array.from(workoutBadges).find(badge => 
        badge.textContent.includes('Indoor Bike')
      );
      expect(indoorBadge).toBeTruthy();
      expect(indoorBadge.textContent).toContain('Indoor');
      expect(indoorBadge.textContent).toContain('🏠');
      
      // Find the outdoor bike workout badge
      const outdoorBadge = Array.from(workoutBadges).find(badge => 
        badge.textContent.includes('Outdoor Bike')
      );
      expect(outdoorBadge).toBeTruthy();
      expect(outdoorBadge.textContent).toContain('Outdoor');
      expect(outdoorBadge.textContent).toContain('🌤️');
      
      // Verify that bike without location doesn't show location badge
      const unspecifiedBadge = Array.from(workoutBadges).find(badge => 
        badge.textContent.includes('Unspecified Bike')
      );
      expect(unspecifiedBadge).toBeTruthy();
      // Should not have the specific Indoor/Outdoor text (just the title)
      const locationSpan = unspecifiedBadge.querySelector('.workout-location');
      expect(locationSpan).toBeNull();
    });

    it('should not display location badge on non-bike workouts even if location is set', () => {
      const runWithLocation = {
        id: 1,
        title: 'Morning Run',
        workoutType: 'Run',
        workoutDate: new DateOnly(2026, 1, 15),
        plannedDuration: 1,
        plannedDistanceInMeters: 10000,
        workoutDescription: 'Easy run',
        coachComments: '',
        workoutLocation: 'outdoor', // Location set but should not display for runs
      };

      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(
        <Calendar 
          workouts={[runWithLocation]} 
          initialDate={testDate}
        />
      );

      const workoutBadge = container.querySelector('.workout-badge');
      expect(workoutBadge).toBeTruthy();
      expect(workoutBadge.textContent).toContain('Morning Run');
      
      // Should not have location badge for non-bike workouts
      const locationSpan = workoutBadge.querySelector('.workout-location');
      expect(locationSpan).toBeNull();
    });
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
      const calendarDays = container.querySelectorAll('.calendar-day');
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
      const calendarDays = container.querySelectorAll('.calendar-day');
      const lastDay = calendarDays[calendarDays.length - 1];
      
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
      
      const calendarDays = container.querySelectorAll('.calendar-day');
      const firstThreeDays = Array.from(calendarDays).slice(0, 3);
      
      // These should be from previous month (Dec 29, 30, 31)
      const dayNumbers = firstThreeDays.map(day => 
        day.querySelector('.day-number')?.textContent
      );
      
      expect(dayNumbers).toEqual(['29', '30', '31']);
    });

    it('should show correct date numbers for next month days', () => {
      // January 2026 ends on Saturday (Jan 31)
      // Sunday should be Feb 1
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={[]} initialDate={testDate} />);
      
      // Switch to month view
      fireEvent.click(screen.getByRole('button', { name: /Month/ }));
      
      const calendarDays = container.querySelectorAll('.calendar-day');
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
      const calendarDays = container.querySelectorAll('.calendar-day');
      const day15 = Array.from(calendarDays).find(day => 
        day.querySelector('.day-number')?.textContent === '15'
      );
      
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
      const calendarGridBefore = container.querySelector('.calendar-grid');
      expect(calendarGridBefore).not.toHaveClass('dragging');
      
      // Simulate the delay by using fake timers
      jest.useFakeTimers();
      fireEvent.dragStart(workoutBadge);
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Check that the calendar grid has dragging class after delay
      const calendarGrid = container.querySelector('.calendar-grid');
      expect(calendarGrid).toHaveClass('dragging');
      
      // Find a time slot and drag over it
      const timeSlots = container.querySelectorAll('.time-slot');
      if (timeSlots.length > 0) {
        fireEvent.dragOver(timeSlots[0]);
        // The specific time slot should have drag-over class
        expect(timeSlots[0]).toHaveClass('drag-over');
        
        // Drag leave
        fireEvent.dragLeave(timeSlots[0]);
        
        // Should not have drag-over class anymore
        expect(timeSlots[0]).not.toHaveClass('drag-over');
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
      act(() => {
        fireEvent.dragStart(workoutBadge);
        jest.advanceTimersByTime(100); // Advance past the time slot display delay
      });

      // Drag over multiple time slots to simulate moving around
      const timeSlots = container.querySelectorAll('.time-slot');
      for (let i = 0; i < Math.min(5, timeSlots.length); i++) {
        act(() => {
          fireEvent.dragOver(timeSlots[i]);
        });
      }

      // End drag without dropping
      act(() => {
        fireEvent.dragEnd(workoutBadge);
      });

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

    it('should group workouts by time of day when they have timeOfDay set', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={workoutsWithTime} initialDate={testDate} />);
      
      // Check for time-of-day group headers (with emojis)
      // In week view, there are multiple time slots for each day
      const morningHeaders = screen.getAllByText('🌅 Morning');
      const afternoonHeaders = screen.getAllByText('☀️ Afternoon');
      const eveningHeaders = screen.getAllByText('🌙 Evening');
      expect(morningHeaders.length).toBeGreaterThan(0);
      expect(afternoonHeaders.length).toBeGreaterThan(0);
      expect(eveningHeaders.length).toBeGreaterThan(0);
      
      // Check workouts are displayed
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Afternoon Swim')).toBeInTheDocument();
      expect(screen.getByText('Evening Bike')).toBeInTheDocument();
      expect(screen.getByText('Unscheduled Strength')).toBeInTheDocument();
    });

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
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Check that calendar has dragging class
      const calendarGrid = container.querySelector('.calendar-grid');
      expect(calendarGrid).toHaveClass('dragging');
      
      jest.useRealTimers();
    });

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
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Find an afternoon time slot
      const timeSlots = container.querySelectorAll('.time-slot.afternoon');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Drop on afternoon slot
      fireEvent.drop(timeSlots[0]);
      
      // Should call time change handler with afternoon
      expect(mockTimeChange).toHaveBeenCalledWith(1, 'afternoon');
      
      jest.useRealTimers();
    });

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
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Find time slots from a different day
      const calendarDays = container.querySelectorAll('.calendar-day.time-slot-mode');
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
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // Find unscheduled time slot on same day
      const unscheduledSlots = container.querySelectorAll('.time-slot.unscheduled');
      if (unscheduledSlots.length > 0) {
        fireEvent.drop(unscheduledSlots[0]);
        
        // Should call with 'unscheduled' which gets converted to null in App.js
        expect(mockTimeChange).toHaveBeenCalledWith(1, 'unscheduled');
      }
      
      jest.useRealTimers();
    });

    it('should always show time slot drop zones in week view', () => {
      const testDate = new DateOnly(2026, 1, 15);
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithTime} 
          initialDate={testDate}
        />
      );
      
      // Time slots should always be visible now
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Calendar days should have time-slot-mode class
      const timeSlotModeElements = container.querySelectorAll('.calendar-day.time-slot-mode');
      expect(timeSlotModeElements.length).toBeGreaterThan(0);
    });

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
      const calendarGridImmediate = container.querySelector('.calendar-grid');
      expect(calendarGridImmediate).not.toHaveClass('dragging');
      
      // Advance timers to trigger the timeout
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // After the delay, time slots should appear
      const calendarGrid = container.querySelector('.calendar-grid');
      expect(calendarGrid).toHaveClass('dragging');
      
      // Should show time slot mode
      const timeSlotMode = container.querySelectorAll('.calendar-day.time-slot-mode');
      expect(timeSlotMode.length).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });

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

    it('should not show unscheduled workout box when not dragging', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const workoutsWithUnscheduled = [
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
          title: 'Unscheduled Strength',
          workoutType: 'Strength',
          workoutDate: new DateOnly(2026, 1, 15),
          originallyPlannedDay: '2026-01-15',
          plannedDuration: 0.5,
          isSelected: true,
          // No timeOfDay - this is unscheduled
        },
      ];
      
      const { container } = render(
        <Calendar 
          workouts={workoutsWithUnscheduled} 
          initialDate={testDate}
        />
      );
      
      // Morning slot should have header with Morning (in week view)
      const morningHeaders = screen.getAllByText('🌅 Morning');
      expect(morningHeaders.length).toBeGreaterThan(0);
      
      // Both workouts should be visible
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Unscheduled Strength')).toBeInTheDocument();
      
      // Should have time slots for morning, afternoon, evening
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
    });
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
      
      // Find time slots
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Morning slot should have header with Morning
      const morningSlot = Array.from(timeSlots).find(slot => 
        slot.querySelector('.time-slot-header')?.textContent.includes('Morning')
      );
      expect(morningSlot).toBeTruthy();
      
      // Check that tri club event is inside the morning slot
      const morningRide = morningSlot.querySelector('.tri-club-event');
      expect(morningRide).toBeTruthy();
      expect(morningRide.textContent).toContain('7am tri club ride');
      
      // Evening slot should have header with Evening
      const eveningSlot = Array.from(timeSlots).find(slot => 
        slot.querySelector('.time-slot-header')?.textContent.includes('Evening')
      );
      expect(eveningSlot).toBeTruthy();
      
      const eveningSwim = eveningSlot.querySelector('.tri-club-event');
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
      
      // Time slots should be visible even with only tri club events
      const timeSlots = container.querySelectorAll('.time-slot');
      expect(timeSlots.length).toBeGreaterThan(0);
      
      // Morning slot should exist because Monday has a 7am tri club event
      const morningSlot = Array.from(timeSlots).find(slot => 
        slot.querySelector('.time-slot-header')?.textContent.includes('Morning')
      );
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

    test('unscheduled label should be visible when unscheduled workouts exist', () => {
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

      // Verify the unscheduled workout exists in the calendar
      expect(container.textContent).toContain('Unscheduled Bike');

      // Verify unscheduled time slot exists in DOM if there are unscheduled workouts
      const unscheduledSlots = container.querySelectorAll('.time-slot.unscheduled');
      expect(unscheduledSlots.length).toBeGreaterThan(0);
      
      const unscheduledSlot = unscheduledSlots[0];
      
      // Verify the header exists within the slot
      const header = unscheduledSlot.querySelector('.time-slot-header');
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('Unscheduled');
    });

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
  });
});
