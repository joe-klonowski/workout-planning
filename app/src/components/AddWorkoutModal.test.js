import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddWorkoutModal from './AddWorkoutModal';

describe('AddWorkoutModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = render(
      <AddWorkoutModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal when open', () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    expect(screen.getByText('Add Custom Workout')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when cancel button is clicked', () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows validation error when title is empty', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('shows validation error when date is empty', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Workout' } });
    
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Group Ride' }
    });
    
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2026-01-18' }
    });
    
    // Submit form
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Group Ride',
        workoutType: 'Swim', // Default value is first in list
        description: '',
        plannedDate: '2026-01-18',
        plannedDuration: null,
        plannedDistanceInMeters: null,
        tss: null,
        timeOfDay: null,
        workoutLocation: null
      });
    });
  });

  test('submits form with all fields filled', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Masters Swim' }
    });
    
    fireEvent.change(screen.getByLabelText(/Type/i), {
      target: { value: 'Swim' }
    });
    
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2026-01-20' }
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Pool workout' }
    });
    
    fireEvent.change(screen.getByLabelText(/Duration \(hours\)/i), {
      target: { value: '1.5' }
    });
    
    fireEvent.change(screen.getByLabelText(/TSS/i), {
      target: { value: '85' }
    });
    
    fireEvent.change(screen.getByLabelText(/Distance \(meters\)/i), {
      target: { value: '3000' }
    });
    
    fireEvent.change(screen.getByLabelText(/Time of Day/i), {
      target: { value: 'morning' }
    });
    
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'indoor' }
    });
    
    // Submit form
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Masters Swim',
        workoutType: 'Swim',
        description: 'Pool workout',
        plannedDate: '2026-01-20',
        plannedDuration: 1.5,
        plannedDistanceInMeters: 3000,
        tss: 85,
        timeOfDay: 'morning',
        workoutLocation: 'indoor'
      });
    });
  });

  test('clears error message when user starts typing', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Submit with empty title to trigger error
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    
    // Start typing in title field
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'T' } });
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  test('validates duration as positive number', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test Workout' }
    });
    
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2026-01-18' }
    });
    
    fireEvent.change(screen.getByLabelText(/Duration \(hours\)/i), {
      target: { value: '-1' }
    });
    
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Duration must be a positive number')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('pre-fills date when initialDate is provided', () => {
    const initialDate = new Date(2026, 0, 25); // January 25, 2026
    
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialDate={initialDate}
      />
    );
    
    const dateInput = screen.getByLabelText(/Date/i);
    expect(dateInput.value).toBe('2026-01-25');
  });

  test('workout type dropdown has all expected options', () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const typeSelect = screen.getByLabelText(/Type/i);
    const options = Array.from(typeSelect.options).map(opt => opt.value);
    
    expect(options).toEqual(['Swim', 'Bike', 'Run', 'Strength', 'Other']);
  });

  test('closes modal and resets form after successful submit', async () => {
    render(
      <AddWorkoutModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test Workout' }
    });
    
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2026-01-18' }
    });
    
    // Submit
    const submitButton = screen.getByText('Add Workout');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
    
    // Modal should close
    expect(mockOnClose).toHaveBeenCalled();
  });
});
