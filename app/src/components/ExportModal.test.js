import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportModal from './ExportModal';
import { DateOnly } from '../utils/DateOnly';

describe('ExportModal', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();
  const defaultStartDate = new DateOnly(2026, 1, 6);
  const defaultEndDate = new DateOnly(2026, 1, 12);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = render(
      <ExportModal
        isOpen={false}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders modal when open', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    expect(screen.getByText('Export to Apple Calendar')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export to Calendar' })).toBeInTheDocument();
  });

  test('displays default dates', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    expect(startDateInput).toHaveValue('2026-01-06');
    expect(endDateInput).toHaveValue('2026-01-12');
  });

  test('calls onClose when cancel button is clicked', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button (×) is clicked', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking outside modal', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    const overlay = screen.getByText('Export to Apple Calendar').closest('.modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not close when clicking inside modal content', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    const modalContent = screen.getByText('Export to Apple Calendar').closest('.modal-content');
    fireEvent.click(modalContent);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('shows error when dates are missing', async () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    await waitFor(() => {
      expect(screen.getByText('Please select both start and end dates')).toBeInTheDocument();
    });
    
    expect(mockOnExport).not.toHaveBeenCalled();
  });

  test('shows error when start date is after end date', async () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    // Set start date after end date
    fireEvent.change(startDateInput, { target: { value: '2026-01-20' } });
    fireEvent.change(endDateInput, { target: { value: '2026-01-10' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    await waitFor(() => {
      expect(screen.getByText('Start date must be before or equal to end date')).toBeInTheDocument();
    });
    
    expect(mockOnExport).not.toHaveBeenCalled();
  });

  test('calls onExport with date range when valid dates are provided', async () => {
    mockOnExport.mockResolvedValue();
    
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith({
        startDate: '2026-01-06',
        endDate: '2026-01-12'
      });
    });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('allows user to change dates', async () => {
    mockOnExport.mockResolvedValue();
    
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    fireEvent.change(startDateInput, { target: { value: '2026-02-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-02-07' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith({
        startDate: '2026-02-01',
        endDate: '2026-02-07'
      });
    });
  });

  test('shows loading state during export', async () => {
    let resolveExport;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);
    
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Exporting...' })).toBeInTheDocument();
    });
    
    // Spinner should be visible with an accessible role
    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Exporting' })).toBeInTheDocument();
    });

    // Buttons should be disabled
    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    
    // Resolve the promise
    resolveExport();
    
    // Modal should close
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('displays error from onExport', async () => {
    const errorMessage = 'Network error occurred';
    mockOnExport.mockRejectedValue(new Error(errorMessage));
    
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Export to Calendar' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Modal should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('displays information about what will be exported', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    );
    
    expect(screen.getByText('What will be exported:')).toBeInTheDocument();
    expect(screen.getByText(/One all-day event per day with workouts/i)).toBeInTheDocument();
    expect(screen.getByText(/Event name: "Joe workout schedule"/i)).toBeInTheDocument();
    expect(screen.getByText(/Includes: workout type, location, time of day, and duration/i)).toBeInTheDocument();
    expect(screen.getByText(/Existing events in this date range will be replaced/i)).toBeInTheDocument();
  });
});
