import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutDetailModal from './WorkoutDetailModal';
import { getWorkoutTypeStyle } from '../utils/workoutTypes';

describe('WorkoutDetailModal Component', () => {
  const mockWorkout = {
    title: 'Morning Run 5k',
    workoutType: 'Run',
    workoutDate: new Date(2026, 0, 15),
    description: 'Easy 5k run in the morning',
    plannedDuration: 0.75,
    plannedDistance: 5000,
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
      plannedDistance: 10000,
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
      workoutDate: new Date(2026, 0, 15),
      description: '',
      plannedDuration: 0,
      plannedDistance: 0,
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
      workoutDate: new Date(2026, 0, 15),
      description: '',
      plannedDuration: 1,
      plannedDistance: 1828,  // ~2000 yards
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
      plannedDistance: 16093,  // ~10 miles
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
      plannedDistance: 1609,  // ~1 mile
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
});
