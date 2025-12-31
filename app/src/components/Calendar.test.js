import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from './Calendar';

describe('Calendar Component', () => {
  const mockWorkouts = [
    {
      title: 'Morning Run',
      workoutType: 'Run',
      workoutDate: new Date('2026-01-15'),
      plannedDuration: 0.75,
      plannedDistance: 5000,
      description: 'Easy 5k run',
      coachComments: 'Keep it easy',
    },
    {
      title: 'Evening Swim',
      workoutType: 'Swim',
      workoutDate: new Date('2026-01-15'),
      plannedDuration: 1,
      plannedDistance: 2000,
      description: 'Swim workout',
      coachComments: '',
    },
    {
      title: 'Bike Ride',
      workoutType: 'Bike',
      workoutDate: new Date('2026-01-16'),
      plannedDuration: 2,
      plannedDistance: 40000,
      description: 'Long ride',
      coachComments: '',
    },
  ];

  it('should render without crashing', () => {
    render(<Calendar workouts={[]} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
  });

  it('should display the current month and year', () => {
    const testDate = new Date('2026-01-15');
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
    const testDate = new Date('2026-02-15');
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should navigate to next month', () => {
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should display workout counts for days with workouts', () => {
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // January 15 has 2 workouts
    expect(screen.getByText('2 workouts')).toBeInTheDocument();
    // January 16 has 1 workout
    expect(screen.getByText('1 workout')).toBeInTheDocument();
  });

  it('should display rest day for days without workouts', () => {
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    const restDayElements = screen.getAllByText('Rest day');
    expect(restDayElements.length).toBeGreaterThan(0);
  });

  it('should correctly match workout dates regardless of timezone', () => {
    // Workouts are stored with dates like "2026-01-15T00:00:00Z" (UTC)
    // The calendar needs to display them correctly in local time
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={mockWorkouts} initialDate={testDate} />);
    
    // Both Jan 15 workouts should be displayed (Morning Run and Evening Swim)
    expect(screen.getByText('2 workouts')).toBeInTheDocument();
    
    // Jan 16 should show its single workout
    expect(screen.getByText('1 workout')).toBeInTheDocument();
    
    // We should NOT see "Rest day" on dates that have workouts
    const allRestDays = screen.getAllByText('Rest day');
    // Rest day should only appear on days that actually don't have workouts
    // Jan 15 and 16 should not show "Rest day"
    const calendarDays = document.querySelectorAll('.calendar-day.has-date');
    const jan15 = Array.from(calendarDays).find(day => day.textContent.includes('15'));
    const jan16 = Array.from(calendarDays).find(day => day.textContent.includes('16'));
    
    expect(jan15).not.toHaveTextContent('Rest day');
    expect(jan16).not.toHaveTextContent('Rest day');
  });

  it('should highlight today', () => {
    render(<Calendar workouts={[]} initialDate={new Date()} />);
    
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
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    // Check for various day numbers in January
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('should navigate multiple months correctly', () => {
    const testDate = new Date('2026-01-15');
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    const nextButton = screen.getByRole('button', { name: /Next/ });
    
    // Go forward 3 months
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('should go to today when today button is clicked', () => {
    const testDate = new Date('2020-01-15'); // Old date
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
        workoutDate: new Date('2026-01-15'),
      },
      {
        title: 'February Workout',
        workoutType: 'Swim',
        workoutDate: new Date('2026-02-15'),
      },
    ];

    const testDate = new Date('2026-01-15');
    const { rerender } = render(<Calendar workouts={workouts} initialDate={testDate} />);
    
    expect(screen.getByText('1 workout')).toBeInTheDocument();
    
    // Navigate to February
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    
    // Should show February
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should handle year boundary transitions', () => {
    const testDate = new Date('2025-12-15');
    render(<Calendar workouts={[]} initialDate={testDate} />);
    
    expect(screen.getByText('December 2025')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });
});
