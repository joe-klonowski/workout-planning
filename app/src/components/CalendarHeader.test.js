import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarHeader from './CalendarHeader';

describe('CalendarHeader', () => {
  const defaultProps = {
    monthYear: 'January 2026',
    viewMode: 'week',
    onViewModeChange: jest.fn(),
    onNavPrevious: jest.fn(),
    onNavNext: jest.fn(),
    onGoToToday: jest.fn(),
    onOpenImport: jest.fn(),
    onOpenExport: jest.fn(),
    onOpenAddWorkout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });

    it('displays the month and year', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByText('January 2026')).toBeInTheDocument();
      expect(screen.getByText('January 2026').tagName).toBe('H2');
    });

    it('renders all navigation buttons', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByText('← Previous')).toBeInTheDocument();
      expect(screen.getByText('Next →')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Import from TrainingPeaks' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export to Apple Calendar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Workout' })).toBeInTheDocument();
    });

    it('renders view mode toggle buttons', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('highlights the week button when in week view', () => {
      render(<CalendarHeader {...defaultProps} viewMode="week" />);
      const weekButton = screen.getByText('Week');
      const monthButton = screen.getByText('Month');
      
      expect(weekButton).toHaveClass('active');
      expect(monthButton).not.toHaveClass('active');
    });

    it('highlights the month button when in month view', () => {
      render(<CalendarHeader {...defaultProps} viewMode="month" />);
      const weekButton = screen.getByText('Week');
      const monthButton = screen.getByText('Month');
      
      expect(weekButton).not.toHaveClass('active');
      expect(monthButton).toHaveClass('active');
    });

    it('calls onViewModeChange with "week" when week button is clicked', () => {
      const onViewModeChange = jest.fn();
      render(<CalendarHeader {...defaultProps} onViewModeChange={onViewModeChange} />);
      
      fireEvent.click(screen.getByText('Week'));
      
      expect(onViewModeChange).toHaveBeenCalledTimes(1);
      expect(onViewModeChange).toHaveBeenCalledWith('week');
    });

    it('calls onViewModeChange with "month" when month button is clicked', () => {
      const onViewModeChange = jest.fn();
      render(<CalendarHeader {...defaultProps} onViewModeChange={onViewModeChange} />);
      
      fireEvent.click(screen.getByText('Month'));
      
      expect(onViewModeChange).toHaveBeenCalledTimes(1);
      expect(onViewModeChange).toHaveBeenCalledWith('month');
    });
  });

  describe('Navigation Buttons', () => {
    it('calls onNavPrevious when previous button is clicked', () => {
      const onNavPrevious = jest.fn();
      render(<CalendarHeader {...defaultProps} onNavPrevious={onNavPrevious} />);
      
      fireEvent.click(screen.getByText('← Previous'));
      
      expect(onNavPrevious).toHaveBeenCalledTimes(1);
    });

    it('calls onNavNext when next button is clicked', () => {
      const onNavNext = jest.fn();
      render(<CalendarHeader {...defaultProps} onNavNext={onNavNext} />);
      
      fireEvent.click(screen.getByText('Next →'));
      
      expect(onNavNext).toHaveBeenCalledTimes(1);
    });

    it('calls onGoToToday when today button is clicked', () => {
      const onGoToToday = jest.fn();
      render(<CalendarHeader {...defaultProps} onGoToToday={onGoToToday} />);
      
      fireEvent.click(screen.getByText('Today'));
      
      expect(onGoToToday).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Buttons', () => {
    it('calls onOpenImport when import button is clicked', () => {
      const onOpenImport = jest.fn();
      render(<CalendarHeader {...defaultProps} onOpenImport={onOpenImport} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Import from TrainingPeaks' }));
      
      expect(onOpenImport).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenExport when export button is clicked', () => {
      const onOpenExport = jest.fn();
      render(<CalendarHeader {...defaultProps} onOpenExport={onOpenExport} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Export to Apple Calendar' }));
      
      expect(onOpenExport).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenAddWorkout when add workout button is clicked', () => {
      const onOpenAddWorkout = jest.fn();
      render(<CalendarHeader {...defaultProps} onOpenAddWorkout={onOpenAddWorkout} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Add Workout' }));
      
      expect(onOpenAddWorkout).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to container', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      const header = container.querySelector('.calendar-header');
      
      expect(header).toBeInTheDocument();
    });

    it('applies correct CSS classes to header sections', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      
      expect(container.querySelector('.header-left')).toBeInTheDocument();
      expect(container.querySelector('.header-right')).toBeInTheDocument();
    });

    it('applies correct CSS classes to buttons', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      
      expect(container.querySelector('.nav-button')).toBeInTheDocument();
      expect(container.querySelector('.today-button')).toBeInTheDocument();
      expect(container.querySelector('.import-workout-button')).toBeInTheDocument();
      expect(container.querySelector('.export-button')).toBeInTheDocument();
      expect(container.querySelector('.add-workout-button')).toBeInTheDocument();
    });

    it('applies correct CSS classes to view toggle', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      
      expect(container.querySelector('.view-toggle')).toBeInTheDocument();
      expect(container.querySelectorAll('.toggle-button')).toHaveLength(2);
    });

    it('applies correct CSS class to month-year heading', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      
      expect(container.querySelector('.month-year')).toBeInTheDocument();
    });
  });

  describe('PropTypes', () => {
    it('accepts all required props', () => {
      // Should not throw any prop validation errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CalendarHeader {...defaultProps} />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles different monthYear formats', () => {
      render(<CalendarHeader {...defaultProps} monthYear="December 2025" />);
      expect(screen.getByText('December 2025')).toBeInTheDocument();
    });

    it('handles long month names', () => {
      render(<CalendarHeader {...defaultProps} monthYear="September 2026" />);
      expect(screen.getByText('September 2026')).toBeInTheDocument();
    });

    it('does not call callbacks multiple times on single click', () => {
      const onNavPrevious = jest.fn();
      render(<CalendarHeader {...defaultProps} onNavPrevious={onNavPrevious} />);
      
      const button = screen.getByText('← Previous');
      fireEvent.click(button);
      
      expect(onNavPrevious).toHaveBeenCalledTimes(1);
    });

    it('maintains view mode state correctly', () => {
      const { rerender } = render(<CalendarHeader {...defaultProps} viewMode="week" />);
      expect(screen.getByText('Week')).toHaveClass('active');
      
      rerender(<CalendarHeader {...defaultProps} viewMode="month" />);
      expect(screen.getByText('Month')).toHaveClass('active');
      expect(screen.getByText('Week')).not.toHaveClass('active');
    });
  });

  describe('Accessibility', () => {
    it('renders buttons as actual button elements', () => {
      render(<CalendarHeader {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has clickable navigation buttons', () => {
      render(<CalendarHeader {...defaultProps} />);
      
      const prevButton = screen.getByText('← Previous');
      const nextButton = screen.getByText('Next →');
      const todayButton = screen.getByText('Today');
      
      expect(prevButton.tagName).toBe('BUTTON');
      expect(nextButton.tagName).toBe('BUTTON');
      expect(todayButton.tagName).toBe('BUTTON');
    });

    it('has clickable action buttons', () => {
      render(<CalendarHeader {...defaultProps} />);
      
      const importButton = screen.getByRole('button', { name: 'Import from TrainingPeaks' });
      const exportButton = screen.getByRole('button', { name: 'Export to Apple Calendar' });
      const addButton = screen.getByRole('button', { name: 'Add Workout' });
      
      expect(importButton.tagName).toBe('BUTTON');
      expect(exportButton.tagName).toBe('BUTTON');
      expect(addButton.tagName).toBe('BUTTON');
    });
  });
});
