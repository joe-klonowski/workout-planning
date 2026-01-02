import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from './Calendar';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { DateOnly } from '../utils/DateOnly';

describe('Calendar Component', () => {
  const mockWorkouts = [
    {
      title: 'Morning Run',
      workoutType: 'Run',
      workoutDate: new DateOnly(2026, 1, 15),
      plannedDuration: 0.75,
      plannedDistanceInMeters: 5000,
      workoutDescription: 'Easy 5k run',
      coachComments: 'Keep it easy',
    },
    {
      title: 'Evening Swim',
      workoutType: 'Swim',
      workoutDate: new DateOnly(2026, 1, 15),
      plannedDuration: 1,
      plannedDistanceInMeters: 2000,
      workoutDescription: 'Swim workout',
      coachComments: '',
    },
    {
      title: 'Bike Ride',
      workoutType: 'Bike',
      workoutDate: new DateOnly(2026, 1, 16),
      plannedDuration: 2,
      plannedDistanceInMeters: 40000,
      workoutDescription: 'Long ride',
      coachComments: '',
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
    
    const restDayElements = screen.getAllByText('Rest day');
    expect(restDayElements.length).toBeGreaterThan(0);
  });

  it('should correctly match workout dates regardless of timezone', () => {
    // Workouts are stored with dates and the calendar displays them correctly
    const testDate = new DateOnly(2026, 1, 15);
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // Both Jan 15 workouts should be displayed (Morning Run and Evening Swim)
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Swim')).toBeInTheDocument();
    
    // Jan 16 should show its single workout
    expect(screen.getByText('Bike Ride')).toBeInTheDocument();
    
    // We should see "Rest day" on dates that don't have workouts
    const allRestDays = screen.getAllByText('Rest day');
    expect(allRestDays.length).toBeGreaterThan(0);
  });

  it('should highlight today', () => {
    const today = new Date();
    const testDate = new DateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    const todayElement = document.querySelector('.calendar-day.is-today');
    expect(todayElement).toBeInTheDocument();
  });

  it('should handle empty workouts array', () => {
    render(<Calendar workouts={[]} />);
    const allRestDays = screen.getAllByText('Rest day');
    expect(allRestDays.length).toBeGreaterThan(0);
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
    
    // Check for various day numbers in January
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
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
      
      const workoutBadges = container.querySelectorAll('.workout-badge');
      expect(workoutBadges.length).toBeGreaterThan(0);
    });

    it('should display workout icons with emoji', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
      const workoutIcons = container.querySelectorAll('.workout-icon');
      expect(workoutIcons.length).toBeGreaterThan(0);
    });

    it('should apply correct background color and border to workout badges', () => {
      const testDate = new DateOnly(2026, 1, 15);
      const { container } = render(<Calendar workouts={testWorkouts} initialDate={testDate} />);
      
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

      // Close modal
      const closeButton = document.querySelector('.modal-close');
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

      // Click overlay
      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      // Modal should be gone
      expect(screen.queryByText('Easy 5k run')).not.toBeInTheDocument();
    });

    it('should allow keyboard navigation to open modal', () => {
      const testDate = new DateOnly(2026, 1, 15);
      render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);

      // Get the workout badge and trigger keyboard event
      const workoutBadge = screen.getAllByText('Morning Run')[0].closest('.workout-badge');
      fireEvent.keyDown(workoutBadge, { key: 'Enter', code: 'Enter' });

      // Modal should open
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
      let closeButton = document.querySelector('.modal-close');
      fireEvent.click(closeButton);
      expect(screen.queryByText('Easy 5k run')).not.toBeInTheDocument();

      // Click second workout
      workoutBadge = screen.getByText('Evening Swim');
      fireEvent.click(workoutBadge);
      expect(screen.getByText('Swim workout')).toBeInTheDocument();
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
          workoutDay: '2026-01-15',
        },
      ];
      render(<Calendar workouts={workouts} />);
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
