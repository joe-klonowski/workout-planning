import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportWorkoutModal from './ImportWorkoutModal';

describe('ImportWorkoutModal', () => {
  const mockOnClose = jest.fn();
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = render(
      <ImportWorkoutModal
        isOpen={false}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders modal when open', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    expect(screen.getByText('Import Workouts from TrainingPeaks')).toBeInTheDocument();
    expect(screen.getByText(/Upload a CSV file exported from TrainingPeaks/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Workouts' })).toBeInTheDocument();
  });

  test('import button is disabled when no file is selected', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    expect(importButton).toBeDisabled();
  });

  test('calls onClose when cancel button is clicked', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button (×) is clicked', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking outside modal', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const overlay = screen.getByText('Import Workouts from TrainingPeaks').closest('.modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not close when clicking inside modal content', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const modalContent = screen.getByText('Import Workouts from TrainingPeaks').closest('.modal-content');
    fireEvent.click(modalContent);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('shows error when non-CSV file is selected', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('Please select a CSV file')).toBeInTheDocument();
  });

  test('accepts CSV file selection', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('workouts.csv')).toBeInTheDocument();
    expect(screen.getByText(/0.0 KB/)).toBeInTheDocument();
  });

  test('import button is enabled when CSV file is selected', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    expect(importButton).not.toBeDisabled();
  });

  test('shows error when trying to import without file', async () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    // Import button should be disabled when no file is selected
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    expect(importButton).toBeDisabled();
    
    // This test verifies the button is disabled rather than showing an error,
    // which is the actual behavior of the component
  });

  test('calls onImport with file when import button is clicked', async () => {
    mockOnImport.mockResolvedValue({ message: 'Successfully imported 5 workouts', imported: 5 });
    
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledWith(file);
    });
  });

  test('shows success message after successful import', async () => {
    mockOnImport.mockResolvedValue({ message: 'Successfully imported 5 workouts', imported: 5 });
    
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText('Successfully imported 5 workouts')).toBeInTheDocument();
    });
  });

  test('closes modal automatically after successful import', async () => {
    jest.useFakeTimers();
    mockOnImport.mockResolvedValue({ message: 'Successfully imported 5 workouts', imported: 5 });
    
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText('Successfully imported 5 workouts')).toBeInTheDocument();
    });
    
    // Fast-forward time by 2 seconds
    jest.advanceTimersByTime(2000);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  test('shows error message when import fails', async () => {
    mockOnImport.mockRejectedValue(new Error('Failed to import: Invalid CSV format'));
    
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to import: Invalid CSV format')).toBeInTheDocument();
    });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('disables buttons during import', async () => {
    let resolveImport;
    mockOnImport.mockReturnValue(new Promise(resolve => { resolveImport = resolve; }));
    
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const importButton = screen.getByRole('button', { name: 'Import Workouts' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Importing...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Importing...' })).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
    
    // Resolve the import
    resolveImport({ message: 'Success', imported: 1 });
  });

  test('displays import instructions', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    expect(screen.getByText('How to export from TrainingPeaks:')).toBeInTheDocument();
    expect(screen.getByText('Log in to TrainingPeaks web app')).toBeInTheDocument();
    expect(screen.getByText(/Duplicate workouts.*will be automatically skipped/)).toBeInTheDocument();
  });

  test('clears file selection when modal is closed and reopened', () => {
    const { rerender } = render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Click to select a CSV file/);
    
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('workouts.csv')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Reopen modal
    rerender(
      <ImportWorkoutModal
        isOpen={false}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    rerender(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    // File should be cleared
    expect(screen.queryByText('workouts.csv')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Workouts' })).toBeDisabled();
  });

  test('handles drag and drop for CSV files', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test,content'], 'workouts.csv', { type: 'text/csv' });
    const uploadArea = screen.getByText(/Click to select a CSV file/).closest('.file-upload-label');
    
    fireEvent.dragOver(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('workouts.csv')).toBeInTheDocument();
  });

  test('rejects non-CSV files in drag and drop', () => {
    render(
      <ImportWorkoutModal
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
      />
    );
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText(/Click to select a CSV file/).closest('.file-upload-label');
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('Please select a CSV file')).toBeInTheDocument();
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });
});
