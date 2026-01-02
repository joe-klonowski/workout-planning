import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutCard from './WorkoutCard';

describe('WorkoutCard Component', () => {
  const mockWorkout = {
    title: 'Morning Run',
    workoutType: 'Run',
    description: 'Easy 5k run on flat terrain',
    plannedDuration: 0.75,
    plannedDistance: 5000,
    coachComments: 'Keep it easy, focus on form',
  };

  it('should render without crashing', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('should display the workout title', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('should display the workout type badge', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('should display planned duration in human-readable format', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('should format duration with hours and minutes', () => {
    const workout = { ...mockWorkout, plannedDuration: 1.75 };
    render(<WorkoutCard workout={workout} />);
    expect(screen.getByText('1h 45m')).toBeInTheDocument();
  });

  it('should format duration with only hours', () => {
    const workout = { ...mockWorkout, plannedDuration: 2 };
    render(<WorkoutCard workout={workout} />);
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('should display planned distance in miles for run workouts', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    // 5000 meters = 3.1 miles
    expect(screen.getByText('3.1 mi')).toBeInTheDocument();
  });

  it('should display planned distance in yards for swim workouts', () => {
    const swimWorkout = {
      ...mockWorkout,
      workoutType: 'Swim',
      plannedDistance: 2000, // 2000 meters
    };
    render(<WorkoutCard workout={swimWorkout} />);
    // 2000 meters ≈ 2188 yards
    expect(screen.getByText('2188 yd')).toBeInTheDocument();
  });

  it('should display planned distance in miles for bike workouts', () => {
    const bikeWorkout = {
      ...mockWorkout,
      workoutType: 'Bike',
      plannedDistance: 40000, // 40 km
    };
    render(<WorkoutCard workout={bikeWorkout} />);
    // 40000 meters ≈ 24.9 miles
    expect(screen.getByText('24.9 mi')).toBeInTheDocument();
  });

  it('should handle zero distance gracefully', () => {
    const workout = { ...mockWorkout, plannedDistance: 0 };
    render(<WorkoutCard workout={workout} />);
    const distanceLabel = screen.queryByText(/Distance:/);
    expect(distanceLabel).not.toBeInTheDocument();
  });

  it('should handle zero duration gracefully', () => {
    const workout = { ...mockWorkout, plannedDuration: 0 };
    render(<WorkoutCard workout={workout} />);
    const durationLabel = screen.queryByText(/Duration:/);
    expect(durationLabel).not.toBeInTheDocument();
  });

  it('should display description in expandable section', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('View workout details')).toBeInTheDocument();
  });

  it('should expand/collapse description on click', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    
    // Initially description should not be visible
    const summary = screen.getByText('View workout details');
    fireEvent.click(summary);
    
    expect(screen.getByText('Easy 5k run on flat terrain')).toBeInTheDocument();
  });

  it('should display coach comments', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText(/Keep it easy, focus on form/)).toBeInTheDocument();
  });

  it('should not display coach comments section if empty', () => {
    const workout = { ...mockWorkout, coachComments: '' };
    render(<WorkoutCard workout={workout} />);
    expect(screen.queryByText(/Coach notes:/)).not.toBeInTheDocument();
  });

  it('should call onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    render(<WorkoutCard workout={mockWorkout} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Morning Run'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should display checkbox when onSelect is provided', () => {
    const handleSelect = jest.fn();
    render(<WorkoutCard workout={mockWorkout} onSelect={handleSelect} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should call onSelect when checkbox is clicked', () => {
    const handleSelect = jest.fn();
    render(<WorkoutCard workout={mockWorkout} onSelect={handleSelect} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(handleSelect).toHaveBeenCalledWith(true);
  });

  it('should display selected state when isSelected is true', () => {
    const { container } = render(
      <WorkoutCard workout={mockWorkout} isSelected={true} />
    );
    
    const card = container.querySelector('.workout-card.selected');
    expect(card).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalWorkout = {
      title: 'Minimal Workout',
      workoutType: 'Other',
    };
    
    render(<WorkoutCard workout={minimalWorkout} />);
    expect(screen.getByText('Minimal Workout')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should handle undefined workout prop', () => {
    const { container } = render(<WorkoutCard workout={undefined} />);
    expect(container.querySelector('.workout-card')).toBeInTheDocument();
  });

  it('should apply correct CSS class for different workout types', () => {
    const { container, rerender } = render(
      <WorkoutCard workout={{ ...mockWorkout, workoutType: 'Run' }} />
    );
    
    let badge = container.querySelector('.type-run');
    expect(badge).toBeInTheDocument();
    
    rerender(<WorkoutCard workout={{ ...mockWorkout, workoutType: 'Swim' }} />);
    badge = container.querySelector('.type-swim');
    expect(badge).toBeInTheDocument();
    
    rerender(<WorkoutCard workout={{ ...mockWorkout, workoutType: 'Bike' }} />);
    badge = container.querySelector('.type-bike');
    expect(badge).toBeInTheDocument();
  });

  it('should handle long titles with word breaking', () => {
    const workout = {
      ...mockWorkout,
      title: 'This is a very long workout title that should break properly',
    };
    render(<WorkoutCard workout={workout} />);
    expect(screen.getByText(/This is a very long workout title/)).toBeInTheDocument();
  });

  it('should not trigger onClick when clicking checkbox', () => {
    const handleClick = jest.fn();
    const handleSelect = jest.fn();
    
    render(
      <WorkoutCard
        workout={mockWorkout}
        onClick={handleClick}
        onSelect={handleSelect}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // onSelect should be called, but onClick should not
    expect(handleSelect).toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
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

    it('should accept valid workout prop with all fields', () => {
      render(<WorkoutCard workout={mockWorkout} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept workout prop with missing optional fields', () => {
      const minimalWorkout = {
        title: 'Test',
        workoutType: 'Run',
      };
      render(<WorkoutCard workout={minimalWorkout} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept null workout prop', () => {
      render(<WorkoutCard workout={null} />);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept valid function props', () => {
      render(
        <WorkoutCard
          workout={mockWorkout}
          onClick={jest.fn()}
          onSelect={jest.fn()}
          isSelected={true}
        />
      );
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept boolean isSelected prop', () => {
      render(<WorkoutCard workout={mockWorkout} isSelected={false} />);
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
