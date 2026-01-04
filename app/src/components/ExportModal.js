import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DateOnly } from '../utils/DateOnly';
import '../styles/ExportModal.css';

/**
 * ExportModal component for exporting workout plans to Apple Calendar
 * Allows user to select a date range for export
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback for when user cancels
 * @param {Function} onExport - Callback for when user confirms export with date range
 * @param {DateOnly} defaultStartDate - Default start date for the date range
 * @param {DateOnly} defaultEndDate - Default end date for the date range
 */
function ExportModal({ isOpen, onClose, onExport, defaultStartDate, defaultEndDate }) {
  const [startDate, setStartDate] = useState(defaultStartDate?.toISOString() || '');
  const [endDate, setEndDate] = useState(defaultEndDate?.toISOString() || '');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Update dates when defaults change
  React.useEffect(() => {
    if (defaultStartDate) {
      setStartDate(defaultStartDate.toISOString());
    }
    if (defaultEndDate) {
      setEndDate(defaultEndDate.toISOString());
    }
  }, [defaultStartDate, defaultEndDate]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setError(null);
    
    // Validate dates
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError('Start date must be before or equal to end date');
      return;
    }
    
    setIsExporting(true);
    try {
      await onExport({
        startDate: startDate,
        endDate: endDate
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to export workouts');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setIsExporting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export to Apple Calendar</h2>
          <button className="close-button" onClick={handleCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="export-description">
            Select the date range to export to your Apple Calendar. 
            This will create all-day events for each day with workouts.
          </p>

          <div className="date-range-picker">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isExporting}
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="export-info">
            <h3>What will be exported:</h3>
            <ul>
              <li>One all-day event per day with workouts</li>
              <li>Event name: "Joe workout schedule"</li>
              <li>Includes: workout type, location, time of day, and duration</li>
              <li>Existing events in this date range will be replaced</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={handleCancel}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="export-button"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export to Calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}

ExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  defaultStartDate: PropTypes.instanceOf(DateOnly),
  defaultEndDate: PropTypes.instanceOf(DateOnly),
};

export default ExportModal;
