import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DateOnly } from '../utils/DateOnly';
import ExportModal from './ExportModal';
import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';
import '../styles/WeeklySummary.css';

/**
 * WeeklySummary component displays a summary of workouts for a given week
 * Shows total hours and breakdown by workout type
 * @param {Array} workouts - Array of workout objects for the week
 * @param {DateOnly} weekStartDate - Start date of the week
 * @param {DateOnly} weekEndDate - End date of the week
 * @param {Function} onExportToCalendar - Callback for exporting to calendar
 */
function WeeklySummary({ workouts = [], weekStartDate, weekEndDate, onExportToCalendar }) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [weeklyTargets, setWeeklyTargets] = useState(null);
  const [targetsError, setTargetsError] = useState(null);

  // Fetch weekly targets
  useEffect(() => {
    // Track if component is still mounted
    let isMounted = true;

    const fetchWeeklyTargets = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.WEEKLY_TARGETS);
        if (!response.ok) {
          throw new Error('Failed to fetch weekly targets');
        }
        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          // API now returns an array of weekly targets
          // Find the matching week based on weekStartDate
          if (Array.isArray(data) && weekStartDate) {
            const weekStartStr = weekStartDate.toISOString();
            const matchingWeek = data.find(week => week.week_start_date === weekStartStr);
            if (matchingWeek) {
              setWeeklyTargets(matchingWeek.weekly_targets);
            } else {
              setWeeklyTargets(null);
            }
          } else {
            setWeeklyTargets(null);
          }
        }
      } catch (error) {
        logger.error('Error fetching weekly targets:', error);
        if (isMounted) {
          setTargetsError(error.message);
        }
      }
    };

    fetchWeeklyTargets();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [weekStartDate]);

  // Filter for selected workouts only
  const selectedWorkouts = workouts.filter(w => w.isSelected);

  // Calculate total hours
  const totalHours = selectedWorkouts.reduce((sum, w) => sum + (w.plannedDuration || 0), 0);

  // Calculate hours by workout type
  const workoutTypeStats = {};
  selectedWorkouts.forEach(workout => {
    let type = workout.workoutType;
    // Map unknown types to 'Other'
    if (!['Swim', 'Bike', 'Run', 'Strength'].includes(type)) {
      type = 'Other';
    }
    if (!workoutTypeStats[type]) {
      workoutTypeStats[type] = {
        hours: 0,
        distance: 0,
        count: 0
      };
    }
    workoutTypeStats[type].hours += workout.plannedDuration || 0;
    workoutTypeStats[type].distance += workout.plannedDistanceInMeters || 0;
    workoutTypeStats[type].count += 1;
  });

  // Format duration to hours and minutes
  const formatDuration = (hours) => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}m`;
    }
  };

  // Format distance (meters to km/miles)
  const formatDistance = (meters, workoutType) => {
    if (meters === 0) return null;
    
    if (workoutType === 'Swim') {
      // For swimming, show in meters (more common)
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
      }
      return `${Math.round(meters)} m`;
    } else {
      // For running/biking, show in km
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Get icon for workout type
  const getWorkoutIcon = (type) => {
    const icons = {
      'Swim': '🏊',
      'Bike': '🚴',
      'Run': '🏃',
      'Strength': '💪',
      'Other': '📋'
    };
    return icons[type] || '📋';
  };

  // Order workout types for consistent display
  const orderedTypes = ['Swim', 'Bike', 'Run', 'Strength', 'Other'];
  const displayTypes = orderedTypes.filter(type => workoutTypeStats[type]);

  // Compute TSS summary values (Completed and Projected)
  let completedTss = 0;
  let projectedTss = 0;

  if (weeklyTargets && weeklyTargets.tss) {
    const today = DateOnly.fromDate(new Date());

    // Completed TSS: workouts in this week that have a TSS and are on or before today
    completedTss = workouts.reduce((sum, w) => {
      if (w.workoutType === 'Strength') return sum;
      if (!w.workoutDate || typeof w.tss !== 'number') return sum;
      if (w.workoutDate.isBefore(today) || w.workoutDate.equals(today)) return sum + (w.tss || 0);
      return sum;
    }, 0);

    // Projected TSS: completedTss + sum of expected TSS for planned (selected) future workouts in the week
    const plannedFutureTss = workouts.reduce((sum, w) => {
      if (w.workoutType === 'Strength') return sum;
      if (!w.isSelected) return sum; // exclude deselected workouts
      if (!w.workoutDate) return sum;
      // Future workouts (after today) or today's workout if it has no TSS yet
      if (w.workoutDate.isAfter(today) || (w.workoutDate.equals(today) && typeof w.tss !== 'number')) {
        return sum + (w.tss || 0);
      }
      return sum;
    }, 0);

    projectedTss = completedTss + plannedFutureTss;
  }

  const handleExport = async (dateRange) => {
    if (onExportToCalendar) {
      await onExportToCalendar(dateRange);
    }
  };

  return (
    <div className="weekly-summary">
      <div className="summary-header">
        <h3>Week Summary</h3>
        <button 
          className="export-button"
          onClick={() => setIsExportModalOpen(true)}
          title="Export to Apple Calendar"
        >
          📅 Export
        </button>
      </div>

      <div className="summary-section total-hours">
        <div className="summary-label">Total Hours</div>
        <div className="summary-value large">{formatDuration(totalHours)}</div>
        {weeklyTargets && weeklyTargets.total_time && (
          <div className="summary-detail">
            Friel Target: {formatDuration(weeklyTargets.total_time.hours + weeklyTargets.total_time.minutes / 60)}
          </div>
        )}
        <div className="summary-detail">{selectedWorkouts.length} workouts</div>
      </div>


      {weeklyTargets && weeklyTargets.tss && (
        <div className="summary-section tss-section">
          <div className="summary-label">TSS (Training Stress Score)</div>
          <div className="summary-row">
            <div className="summary-detail">Completed: <span className="summary-value">{completedTss.toFixed(0)}</span></div>
            <div className="summary-detail">Projected: <span className="summary-value">{projectedTss.toFixed(0)}</span></div>
          </div>
          <div className="summary-detail">Friel Target: {weeklyTargets.tss}</div>
        </div>
      )}

      {displayTypes.length > 0 && (
        <div className="summary-section breakdown">
          <div className="summary-label">By Type</div>
          <div className="breakdown-list">
            {displayTypes.map(type => {
              const stats = workoutTypeStats[type];
              const distance = formatDistance(stats.distance, type);
              
              // Get target for this discipline
              const disciplineKey = type.toLowerCase();
              const target = weeklyTargets?.by_discipline?.[disciplineKey];
              
              return (
                <div key={type} className="breakdown-item">
                  <div className="breakdown-header">
                    <span className="breakdown-icon">{getWorkoutIcon(type)}</span>
                    <span className="breakdown-type">{type}</span>
                  </div>
                  <div className="breakdown-stats">
                    <div className="breakdown-stat">
                      <span className="stat-label">Planned duration:</span>
                      <span className="stat-value">{formatDuration(stats.hours)}</span>
                    </div>
                    {target && (
                      <div className="breakdown-stat">
                        <span className="stat-label">Friel target duration:</span>
                        <span className="stat-value">
                          {formatDuration(target.hours + target.minutes / 60)}
                        </span>
                      </div>
                    )}
                    {distance && (
                      <div className="breakdown-stat">
                        <span className="stat-label">Planned distance:</span>
                        <span className="stat-value">{distance}</span>
                      </div>
                    )}
                    <div className="breakdown-stat">
                      <span className="stat-label">Count:</span>
                      <span className="stat-value">{stats.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedWorkouts.length === 0 && (
        <div className="summary-section empty-state">
          <div className="empty-icon">🏖️</div>
          <div className="empty-text">No workouts planned</div>
        </div>
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        defaultStartDate={weekStartDate}
        defaultEndDate={weekEndDate}
      />
    </div>
  );
}

WeeklySummary.propTypes = {
  workouts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string.isRequired,
      workoutType: PropTypes.string.isRequired,
      workoutDate: PropTypes.instanceOf(DateOnly).isRequired,
      plannedDuration: PropTypes.number,
      plannedDistanceInMeters: PropTypes.number,
      isSelected: PropTypes.bool,
    })
  ),
  weekStartDate: PropTypes.instanceOf(DateOnly),
  weekEndDate: PropTypes.instanceOf(DateOnly),
  onExportToCalendar: PropTypes.func,
};

WeeklySummary.defaultProps = {
  workouts: [],
};

export default WeeklySummary;
