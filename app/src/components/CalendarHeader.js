import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/CalendarHeader.css';

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
  onOpenExport,
  onOpenAddWorkout,
  filters,
  onFilterChange
}) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
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
          className="import-workout-button icon-button"
          title="Import from TrainingPeaks"
          aria-label="Import from TrainingPeaks"
        >
          📥
        </button>
        <button
          onClick={onOpenExport}
          className="export-button icon-button"
          title="Export to Apple Calendar"
          aria-label="Export to Apple Calendar"
        >
          📅
        </button>
        <button 
          onClick={onOpenAddWorkout} 
          className="add-workout-button icon-button"
          title="Add Workout"
          aria-label="Add Workout"
        >
          ➕
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

        {/* Filter menu button and dropdown */}
        <div className="filter-menu-container">
          <button
            className="filter-menu-button icon-button"
            aria-label="Open source filters"
            aria-haspopup="true"
            aria-expanded={isFilterMenuOpen}
            onClick={() => setIsFilterMenuOpen(prev => !prev)}
          >
            ⚙️
          </button>

          {isFilterMenuOpen && (
            <div className="filter-menu" role="menu" aria-label="Workout source filters">
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={filters?.showFriel ?? true}
                  onChange={(e) => onFilterChange && onFilterChange({ ...filters, showFriel: e.target.checked })}
                  aria-label="Show Friel plan"
                />
                Friel
              </label>
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={filters?.showTriClub ?? true}
                  onChange={(e) => onFilterChange && onFilterChange({ ...filters, showTriClub: e.target.checked })}
                  aria-label="Show Tri club"
                />
                Tri club
              </label>
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={filters?.showOther ?? true}
                  onChange={(e) => onFilterChange && onFilterChange({ ...filters, showOther: e.target.checked })}
                  aria-label="Show Other"
                />
                Other
              </label>
            </div>
          )}
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
  onOpenExport: PropTypes.func.isRequired,
  onOpenAddWorkout: PropTypes.func.isRequired,
  // Source filters
  filters: PropTypes.shape({
    showFriel: PropTypes.bool,
    showTriClub: PropTypes.bool,
    showOther: PropTypes.bool,
  }),
  onFilterChange: PropTypes.func,
};

CalendarHeader.defaultProps = {
  filters: {
    showFriel: true,
    showTriClub: true,
    showOther: true,
  },
  onFilterChange: null,
};

export default CalendarHeader;
