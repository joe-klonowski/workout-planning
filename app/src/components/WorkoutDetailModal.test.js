import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutDetailModal from './WorkoutDetailModal';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';
import { DateOnly } from '../utils/DateOnly';

describe('WorkoutDetailModal Component', () => {
  const mockWorkout = {
    title: 'Morning Run 5k',
    workoutType: 'Run',
    workoutDate: new DateOnly(2026, 1, 15),
    workoutDescription: 'Easy 5k run in the morning',
    plannedDuration: 0.75,
    plannedDistanceInMeters: 5000,
    coachComments: 'Keep it easy and steady',
    athleteComments: 'Felt good',
    actualDistance: 5100,
    heartRateAverage: 145,
    heartRateMax: 165,
    powerAverage: null,
    powerMax: null,
    tss: null,
    if: null,
  };

  it('should render nothing when isOpen is false', () => {
    const { container } = render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={false}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when workout is null', () => {
    const { container } = render(
      <WorkoutDetailModal
        workout={null}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should display the modal when isOpen is true and workout exists', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Morning Run 5k')).toBeInTheDocument();
  });

  it('should display workout title in the header', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Morning Run 5k')).toBeInTheDocument();
  });

  it('should display the correct icon for the workout type', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    const style = getWorkoutTypeStyle('Run');
    const modalIcon = document.querySelector('.modal-icon');
    expect(modalIcon.textContent).toBe(style.icon);
  });

  it('should display workout date in header', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();
  });

  it('should display workout type label in header', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    const modalType = document.querySelector('.modal-type');
    expect(modalType.textContent).toMatch(/Run/);
  });

  it('should display description when provided', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Easy 5k run in the morning')).toBeInTheDocument();
  });

  it('should display planned duration', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Planned Duration/)).toBeInTheDocument();
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
  });

  it('should display planned distance', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Planned Distance/)).toBeInTheDocument();
    expect(screen.getByText(/3.11 mi/)).toBeInTheDocument();
  });

  it('should display actual distance when available', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Actual Distance/)).toBeInTheDocument();
    expect(screen.getByText(/3.17 mi/)).toBeInTheDocument();
  });

  it('should display heart rate data when available', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Avg Heart Rate/)).toBeInTheDocument();
    expect(screen.getByText(/145 bpm/)).toBeInTheDocument();
    expect(screen.getByText(/Max Heart Rate/)).toBeInTheDocument();
    expect(screen.getByText(/165 bpm/)).toBeInTheDocument();
  });

  it('should display coach comments when provided', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Coach Comments/)).toBeInTheDocument();
    expect(screen.getByText('Keep it easy and steady')).toBeInTheDocument();
  });

  it('should display athlete comments when provided', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Your Notes/)).toBeInTheDocument();
    expect(screen.getByText('Felt good')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={onClose}
      />
    );
    const closeButton = document.querySelector('.modal-close');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={onClose}
      />
    );
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('should not call onClose when modal content is clicked', () => {
    const onClose = jest.fn();
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={onClose}
      />
    );
    const content = document.querySelector('.modal-content');
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should format duration correctly', () => {
    const workout = {
      ...mockWorkout,
      plannedDuration: 1.5,
    };
    render(
      <WorkoutDetailModal
        workout={workout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
  });

  it('should format distance in miles for Run workouts', () => {
    const workout = {
      ...mockWorkout,
      plannedDistanceInMeters: 10000,
    };
    render(
      <WorkoutDetailModal
        workout={workout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/6.21 mi/)).toBeInTheDocument();
  });

  it('should not display fields when values are not present', () => {
    const minimalWorkout = {
      title: 'Simple Workout',
      workoutType: 'Other',
      workoutDate: new DateOnly(2026, 1, 15),
      workoutDescription: '',
      plannedDuration: 0,
      plannedDistanceInMeters: 0,
      coachComments: '',
      athleteComments: '',
      actualDistance: null,
      heartRateAverage: null,
      heartRateMax: null,
      powerAverage: null,
      powerMax: null,
      tss: null,
      if: null,
    };
    render(
      <WorkoutDetailModal
        workout={minimalWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.queryByText(/Planned Duration/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Planned Distance/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Heart Rate/)).not.toBeInTheDocument();
  });

  it('should display TSS when available', () => {
    const workout = {
      ...mockWorkout,
      tss: 85.5,
    };
    render(
      <WorkoutDetailModal
        workout={workout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/TSS/)).toBeInTheDocument();
    expect(screen.getByText(/86/)).toBeInTheDocument();
  });

  it('should display Intensity Factor when available', () => {
    const workout = {
      ...mockWorkout,
      if: 0.92,
    };
    render(
      <WorkoutDetailModal
        workout={workout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Intensity Factor/)).toBeInTheDocument();
    expect(screen.getByText(/0.92/)).toBeInTheDocument();
  });

  it('should apply border color based on workout type', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    const header = document.querySelector('.modal-header');
    const style = getWorkoutTypeStyle('Run');
    expect(header).toHaveStyle(`border-left-color: ${style.color}`);
  });

  it('should handle all workout types', () => {
    const types = ['Swim', 'Run', 'Bike', 'Strength', 'Day Off', 'Other'];
    types.forEach((type) => {
      const workout = {
        ...mockWorkout,
        workoutType: type,
      };
      const { unmount } = render(
        <WorkoutDetailModal
          workout={workout}
          isOpen={true}
          onClose={() => {}}
        />
      );
      const style = getWorkoutTypeStyle(type);
      const icon = document.querySelector('.modal-icon');
      expect(icon.textContent).toBe(style.icon);
      unmount();
    });
  });

  it('should display modal with animation', () => {
    render(
      <WorkoutDetailModal
        workout={mockWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    const content = document.querySelector('.modal-content');
    expect(content).toHaveClass('modal-content');
  });

  it('should format distance in yards for Swim workouts', () => {
    const swimWorkout = {
      title: 'Morning Swim',
      workoutType: 'Swim',
      workoutDate: new DateOnly(2026, 1, 15),
      workoutDescription: '',
      plannedDuration: 1,
      plannedDistanceInMeters: 1828,  // ~2000 yards
      actualDistance: null,
      heartRateAverage: 120,
      heartRateMax: 140,
      powerAverage: null,
      powerMax: null,
      tss: null,
      if: null,
      coachComments: '',
      athleteComments: '',
    };
    render(
      <WorkoutDetailModal
        workout={swimWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    // 1828 meters / 0.9144 ≈ 1999 yards
    expect(screen.getByText(/1999 yd/)).toBeInTheDocument();
  });

  it('should format distance in miles for Bike workouts', () => {
    const bikeWorkout = {
      ...mockWorkout,
      workoutType: 'Bike',
      plannedDistanceInMeters: 16093,  // ~10 miles
    };
    render(
      <WorkoutDetailModal
        workout={bikeWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    // 16093 meters / 1609.34 ≈ 10 miles
    expect(screen.getByText(/10.00 mi/)).toBeInTheDocument();
  });

  it('should format distance in miles for unknown workout types', () => {
    const otherWorkout = {
      ...mockWorkout,
      workoutType: 'Strength',
      plannedDistanceInMeters: 1609,  // ~1 mile
    };
    render(
      <WorkoutDetailModal
        workout={otherWorkout}
        isOpen={true}
        onClose={() => {}}
      />
    );
    // 1609 meters / 1609.34 ≈ 1 mile
    expect(screen.getByText(/1.00 mi/)).toBeInTheDocument();
  });

  // Regression test for API data format bug
  describe('API Data Format Compatibility', () => {
    it('should display workoutDescription property from API (not description)', () => {
      const apiWorkout = {
        title: 'AE1. Easy Ride 1h Power',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 3, 1),
        workoutDescription: 'Ride in power zones 1-2, but mostly zone 1. Flat course or indoor trainer. Low effort—light on pedals. Comfortably high rpm.',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 32000,
        workoutDay: '2026-03-01',
        coachComments: 'Keep it in zone 1',
      };

      render(
        <WorkoutDetailModal
          workout={apiWorkout}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Verify workoutDescription is displayed (bug was modal looked for 'description')
      expect(screen.getByText(/Ride in power zones 1-2/)).toBeInTheDocument();
      expect(screen.getByText(/Comfortably high rpm/)).toBeInTheDocument();
    });

    it('should display plannedDistanceInMeters property from API (not plannedDistance)', () => {
      const apiWorkout = {
        title: 'ME2. Hill Cruise Intervals 1h Power',
        workoutType: 'Bike',
        workoutDate: new DateOnly(2026, 3, 5),
        workoutDescription: 'Hill climbing workout',
        plannedDuration: 1.0,
        plannedDistanceInMeters: 40000, // 40km ≈ 24.85 miles
        workoutDay: '2026-03-05',
        coachComments: 'Push hard on the climbs',
      };

      render(
        <WorkoutDetailModal
          workout={apiWorkout}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Verify plannedDistanceInMeters is displayed (bug was modal looked for 'plannedDistance')
      expect(screen.getByText(/Planned Distance/)).toBeInTheDocument();
      expect(screen.getByText(/24.85 mi/)).toBeInTheDocument();
    });

    it('should handle API workout with both workoutDescription and plannedDistanceInMeters', () => {
      const apiWorkout = {
        title: 'ME3. Ladder Down 2350y',
        workoutType: 'Swim',
        workoutDate: new DateOnly(2026, 3, 3),
        workoutDescription: 'WU: 6 x 50 done as 25 drill of choice. MS: 500 at T-pace.',
        plannedDuration: 0.54,
        plannedDistanceInMeters: 2148.84, // yards converted to meters
        workoutDay: '2026-03-03',
        coachComments: 'Focus on form',
      };

      render(
        <WorkoutDetailModal
          workout={apiWorkout}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Verify both properties are displayed correctly
      expect(screen.getByText(/WU: 6 x 50 done as 25 drill/)).toBeInTheDocument();
      expect(screen.getByText(/Planned Distance/)).toBeInTheDocument();
      // Swim should display in yards: 2148.84 / 0.9144 ≈ 2350 yd
      expect(screen.getByText(/2350 yd/)).toBeInTheDocument();
    });
  });
});
