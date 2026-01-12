import React from 'react';
import PropTypes from 'prop-types';

/**
 * CalendarHeader displays the calendar navigation controls, view mode toggle, and action buttons
 * @param {string} monthYear - Formatted month and year string (e.g., "January 2026")
 * @param {string} viewMode - Current view mode ('week' or 'month')
 * @param {Function} onViewModeChange - Callback when view mode is changed
 * @param {Function} onNavPrevious - Callback for previous week/month navigation
 * @param {Function} onNavNext - Callback for next week/month navigation
 * @param {Function} onGoToToday - Callback to navigate to today
 * @param {Function} onOpenImport - Callback to open import modal
 * @param {Function} onOpenAddWorkout - Callback to open add workout modal
 */
function CalendarHeader({
  monthYear,
  viewMode,
  onViewModeChange,
  onNavPrevious,
  onNavNext,
  onGoToToday,
  onOpenImport,
  onOpenAddWorkout
}) {
  return (
    <div className="calendar-header">
      <div className="header-left">
        <button onClick={onNavPrevious} className="nav-button">
          ← Previous
        </button>
        <h2 className="month-year">{monthYear}</h2>
        <button onClick={onNavNext} className="nav-button">
          Next →
        </button>
        <button onClick={onGoToToday} className="today-button">
          Today
        </button>
      </div>
      <div className="header-right">
        <button 
          onClick={onOpenImport} 
          className="import-workout-button"
        >
          📥 Import from TrainingPeaks
        </button>
        <button 
          onClick={onOpenAddWorkout} 
          className="add-workout-button"
        >
          + Add Workout
        </button>
        <div className="view-toggle">
          <button
            onClick={() => onViewModeChange('week')}
            className={`toggle-button ${viewMode === 'week' ? 'active' : ''}`}
          >
            Week
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={`toggle-button ${viewMode === 'month' ? 'active' : ''}`}
          >
            Month
          </button>
        </div>
      </div>
    </div>
  );
}

CalendarHeader.propTypes = {
  monthYear: PropTypes.string.isRequired,
  viewMode: PropTypes.oneOf(['week', 'month']).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  onNavPrevious: PropTypes.func.isRequired,
  onNavNext: PropTypes.func.isRequired,
  onGoToToday: PropTypes.func.isRequired,
  onOpenImport: PropTypes.func.isRequired,
  onOpenAddWorkout: PropTypes.func.isRequired,
};

export default CalendarHeader;
