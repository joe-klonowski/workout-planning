import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/ImportWorkoutModal.css';

/**
 * ImportWorkoutModal component for importing workouts from TrainingPeaks CSV files
 * Allows user to upload a CSV file and import workouts into the database
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback for when user cancels
 * @param {Function} onImport - Callback for when user imports workouts with CSV file
 */
function ImportWorkoutModal({ isOpen, onClose, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsImporting(true);

    try {
      const result = await onImport(selectedFile);
      setSuccessMessage(result.message || `Successfully imported ${result.imported} workouts`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close modal after successful import
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to import workouts');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    setIsImporting(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
        setSuccessMessage(null);
      } else {
        setError('Please select a CSV file');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Workouts from TrainingPeaks</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="import-description">
            Upload a CSV file exported from TrainingPeaks. This will import both planned and completed workouts.
          </p>

          <div 
            className="file-upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              {selectedFile ? (
                <div className="file-selected">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-icon">⬆️</span>
                  <span className="upload-text">
                    Click to select a CSV file or drag and drop here
                  </span>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-message" role="status">
              {successMessage}
            </div>
          )}

          <div className="import-info">
            <h3>How to export from TrainingPeaks:</h3>
            <ol>
              <li>Log in to TrainingPeaks web app</li>
              <li>Go to your calendar view</li>
              <li>Click on "Workouts" menu</li>
              <li>Select "Export Workouts"</li>
              <li>Choose your date range</li>
              <li>Download the CSV file</li>
              <li>Upload it here</li>
            </ol>
            <p className="import-note">
              <strong>Note:</strong> Duplicate workouts (same title and date) will be automatically skipped.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </button>
          <button 
            className="import-button" 
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
          >
            {isImporting ? 'Importing...' : 'Import Workouts'}
          </button>
        </div>
      </div>
    </div>
  );
}

ImportWorkoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
};

export default ImportWorkoutModal;
