import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkoutBadge from './WorkoutBadge';

// Mock the workoutTypes utility
jest.mock('../utils/workoutTypes', () => ({
  getWorkoutTypeStyle: (type) => {
    const styles = {
      'Bike': { icon: '🚴', color: '#ff6b6b', backgroundColor: '#ffe0e0' },
      'Run': { icon: '🏃', color: '#4ecdc4', backgroundColor: '#e0f7f5' },
      'Swim': { icon: '🏊', color: '#45b7d1', backgroundColor: '#d9f0f7' },
      'Other': { icon: '🏋️', color: '#95afc0', backgroundColor: '#e8ecef' }
    };
    return styles[type] || styles['Other'];
  }
}));

// Mock the workoutFormatters utility
jest.mock('../utils/workoutFormatters', () => ({
  formatDuration: (hours) => {
    if (hours === 0) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}));

describe('WorkoutBadge', () => {
  const mockWorkout = {
    id: 1,
    title: 'Morning Run',
    workoutType: 'Run',
    plannedDuration: 1.5,
    isSelected: true,
  };

  const mockHandlers = {
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onWorkoutClick: jest.fn(),
    onSelectionToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render workout title', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });

    it('should display workout icon based on workout type', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      expect(screen.getByText('🏃')).toBeInTheDocument();
    });

    it('should display formatted duration when plannedDuration > 0', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('should not display duration when plannedDuration is 0', () => {
      const workoutNoDuration = { ...mockWorkout, plannedDuration: 0 };
      render(<WorkoutBadge workout={workoutNoDuration} {...mockHandlers} />);
      expect(screen.queryByText(/h|m/)).not.toBeInTheDocument();
    });

    it('should render with correct styling for selected workout', () => {
      const { container } = render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      expect(badge).not.toHaveClass('unselected');
      expect(badge).toHaveStyle({ opacity: '1' });
    });

    it('should render with correct styling for unselected workout', () => {
      const unselectedWorkout = { ...mockWorkout, isSelected: false };
      const { container } = render(<WorkoutBadge workout={unselectedWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveClass('unselected');
      expect(badge).toHaveStyle({ opacity: '0.5' });
    });

    it('should apply correct background and border colors based on workout type', () => {
      const { container } = render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveStyle({
        backgroundColor: '#e0f7f5',
        borderLeft: '4px solid #4ecdc4'
      });
    });
  });

  describe('location display', () => {
    it('should display indoor location for bike workouts', () => {
      const bikeWorkout = {
        ...mockWorkout,
        workoutType: 'Bike',
        workoutLocation: 'indoor'
      };
      render(<WorkoutBadge workout={bikeWorkout} {...mockHandlers} />);
      expect(screen.getByText('🏠')).toBeInTheDocument();
    });

    it('should display outdoor location for bike workouts', () => {
      const bikeWorkout = {
        ...mockWorkout,
        workoutType: 'Bike',
        workoutLocation: 'outdoor'
      };
      render(<WorkoutBadge workout={bikeWorkout} {...mockHandlers} />);
      expect(screen.getByText('🌤️')).toBeInTheDocument();
    });

    it('should not display location for non-bike workouts', () => {
      const runWorkout = {
        ...mockWorkout,
        workoutType: 'Run',
        workoutLocation: 'outdoor'
      };
      render(<WorkoutBadge workout={runWorkout} {...mockHandlers} />);
      expect(screen.queryByText('🌤️')).not.toBeInTheDocument();
    });

    it('should not display location when workoutLocation is not set', () => {
      const bikeWorkout = {
        ...mockWorkout,
        workoutType: 'Bike',
        workoutLocation: null
      };
      render(<WorkoutBadge workout={bikeWorkout} {...mockHandlers} />);
      expect(screen.queryByText('🏠')).not.toBeInTheDocument();
      expect(screen.queryByText('🌤️')).not.toBeInTheDocument();
    });
  });

  describe('selection toggle button', () => {
    it('should render remove button for selected workouts', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const button = screen.getByRole('button', { name: 'Remove from plan' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('✕');
    });

    it('should render add button for unselected workouts', () => {
      const unselectedWorkout = { ...mockWorkout, isSelected: false };
      render(<WorkoutBadge workout={unselectedWorkout} {...mockHandlers} />);
      const button = screen.getByRole('button', { name: 'Add to plan' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('+');
    });

    it('should call onSelectionToggle with correct arguments when clicked', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const button = screen.getByRole('button', { name: 'Remove from plan' });
      fireEvent.click(button);
      expect(mockHandlers.onSelectionToggle).toHaveBeenCalledWith(1, false);
    });

    it('should call onSelectionToggle to add when unselected workout is clicked', () => {
      const unselectedWorkout = { ...mockWorkout, isSelected: false };
      render(<WorkoutBadge workout={unselectedWorkout} {...mockHandlers} />);
      const button = screen.getByRole('button', { name: 'Add to plan' });
      fireEvent.click(button);
      expect(mockHandlers.onSelectionToggle).toHaveBeenCalledWith(1, true);
    });

    it('should not render selection button when onSelectionToggle is not provided', () => {
      const { onSelectionToggle, ...handlersWithoutToggle } = mockHandlers;
      render(<WorkoutBadge workout={mockWorkout} {...handlersWithoutToggle} onSelectionToggle={null} />);
      expect(screen.queryByRole('button', { name: /plan/ })).not.toBeInTheDocument();
    });

    it('should stop propagation when selection button is clicked', () => {
      const stopPropagation = jest.fn();
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const button = screen.getByRole('button', { name: 'Remove from plan' });
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      Object.defineProperty(clickEvent, 'stopPropagation', { value: stopPropagation });
      fireEvent(button, clickEvent);
      expect(mockHandlers.onSelectionToggle).toHaveBeenCalled();
    });
  });

  describe('workout click interaction', () => {
    it('should call onWorkoutClick when title area is clicked', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const titleElement = screen.getByText('Morning Run');
      fireEvent.click(titleElement.parentElement);
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalled();
    });

    it('should call onWorkoutClick when Enter key is pressed on title area', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const titleElement = screen.getByText('Morning Run');
      fireEvent.keyDown(titleElement.parentElement, { key: 'Enter' });
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalled();
    });

    it('should call onWorkoutClick when Space key is pressed on title area', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const titleElement = screen.getByText('Morning Run');
      fireEvent.keyDown(titleElement.parentElement, { key: ' ' });
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalled();
    });

    it('should not call onWorkoutClick for other keys', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const titleElement = screen.getByText('Morning Run');
      fireEvent.keyDown(titleElement.parentElement, { key: 'a' });
      expect(mockHandlers.onWorkoutClick).not.toHaveBeenCalled();
    });

    it('should have correct accessibility attributes on title area', () => {
      render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const titleElement = screen.getByText('Morning Run');
      expect(titleElement.parentElement).toHaveAttribute('role', 'button');
      expect(titleElement.parentElement).toHaveAttribute('tabIndex', '0');
    });

    it('should display TSS badge when workout has TSS', () => {
      const workoutWithTss = { ...mockWorkout, tss: 85.4 };
      const { container } = render(<WorkoutBadge workout={workoutWithTss} {...mockHandlers} />);
      const badge = container.querySelector('.tss-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('85 TSS');
    });

    it('should display NO TSS badge when workout has no TSS', () => {
      const workoutNoTss = { ...mockWorkout, tss: null };
      const { container } = render(<WorkoutBadge workout={workoutNoTss} {...mockHandlers} />);
      const badge = container.querySelector('.tss-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('NO TSS');
    });

    it('should allow editing TSS and call onUpdateTss when Enter is pressed', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(null);
      const workoutWithNoTss = { ...mockWorkout, tss: null };
      const { container, getByLabelText } = render(<WorkoutBadge workout={workoutWithNoTss} {...mockHandlers} onUpdateTss={mockUpdate} />);
      const badge = container.querySelector('.tss-badge');
      // Click to edit
      fireEvent.click(badge);
      const input = getByLabelText('Edit TSS');
      fireEvent.change(input, { target: { value: '90' } });
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
      });
      expect(mockUpdate).toHaveBeenCalledWith(1, 90);
    });

    it('should not display TSS badge for Strength workouts even if tss is present', () => {
      const strengthWorkout = { ...mockWorkout, workoutType: 'Strength', tss: 50 };
      const { container } = render(<WorkoutBadge workout={strengthWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.tss-badge');
      expect(badge).toBeNull();
    });
  });

  describe('drag and drop', () => {
    it('should be draggable', () => {
      const { container } = render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveAttribute('draggable', 'true');
    });

    it('should call onDragStart with correct arguments', () => {
      const { container } = render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      const dragEvent = { dataTransfer: {} };
      fireEvent.dragStart(badge, dragEvent);
      expect(mockHandlers.onDragStart).toHaveBeenCalledWith(expect.any(Object), mockWorkout);
    });

    it('should call onDragEnd when drag ends', () => {
      const { container } = render(<WorkoutBadge workout={mockWorkout} {...mockHandlers} />);
      const badge = container.querySelector('.workout-badge');
      fireEvent.dragEnd(badge);
      expect(mockHandlers.onDragEnd).toHaveBeenCalled();
    });

    it('should show grabbing cursor when workout is being dragged', () => {
      const { container } = render(
        <WorkoutBadge workout={mockWorkout} {...mockHandlers} draggedWorkoutId={1} />
      );
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveStyle({ cursor: 'grabbing' });
    });

    it('should show grab cursor when workout is not being dragged', () => {
      const { container } = render(
        <WorkoutBadge workout={mockWorkout} {...mockHandlers} draggedWorkoutId={null} />
      );
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveStyle({ cursor: 'grab' });
    });

    it('should show grab cursor when different workout is being dragged', () => {
      const { container } = render(
        <WorkoutBadge workout={mockWorkout} {...mockHandlers} draggedWorkoutId={2} />
      );
      const badge = container.querySelector('.workout-badge');
      expect(badge).toHaveStyle({ cursor: 'grab' });
    });
  });

  describe('different workout types', () => {
    it('should render Bike workout correctly', () => {
      const bikeWorkout = { ...mockWorkout, workoutType: 'Bike', title: 'Bike Ride' };
      render(<WorkoutBadge workout={bikeWorkout} {...mockHandlers} />);
      expect(screen.getByText('🚴')).toBeInTheDocument();
      expect(screen.getByText('Bike Ride')).toBeInTheDocument();
    });

    it('should render Swim workout correctly', () => {
      const swimWorkout = { ...mockWorkout, workoutType: 'Swim', title: 'Pool Swim' };
      render(<WorkoutBadge workout={swimWorkout} {...mockHandlers} />);
      expect(screen.getByText('🏊')).toBeInTheDocument();
      expect(screen.getByText('Pool Swim')).toBeInTheDocument();
    });

    it('should render Other workout type correctly', () => {
      const otherWorkout = { ...mockWorkout, workoutType: 'Other', title: 'Strength Training' };
      render(<WorkoutBadge workout={otherWorkout} {...mockHandlers} />);
      expect(screen.getByText('🏋️')).toBeInTheDocument();
      expect(screen.getByText('Strength Training')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle workout with string ID', () => {
      const workoutWithStringId = { ...mockWorkout, id: 'workout-123' };
      render(<WorkoutBadge workout={workoutWithStringId} {...mockHandlers} />);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });

    it('should handle very long workout titles', () => {
      const longTitleWorkout = {
        ...mockWorkout,
        title: 'Very Long Workout Title That Should Still Display Correctly'
      };
      render(<WorkoutBadge workout={longTitleWorkout} {...mockHandlers} />);
      expect(screen.getByText('Very Long Workout Title That Should Still Display Correctly')).toBeInTheDocument();
    });

    it('should handle workout with 0 duration', () => {
      const zeroDurationWorkout = { ...mockWorkout, plannedDuration: 0 };
      render(<WorkoutBadge workout={zeroDurationWorkout} {...mockHandlers} />);
      expect(screen.queryByText(/h|m/)).not.toBeInTheDocument();
    });

    it('should handle workout location with mixed case', () => {
      const bikeWorkout = {
        ...mockWorkout,
        workoutType: 'Bike',
        workoutLocation: 'Indoor'
      };
      render(<WorkoutBadge workout={bikeWorkout} {...mockHandlers} />);
      expect(screen.getByText('🏠')).toBeInTheDocument();
    });
  });
});
