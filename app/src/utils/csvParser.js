/**
 * CSV Parser utility for TrainingPeaks workout exports
 * Handles parsing CSV data and converting to Workout objects
 */

import { DateOnly } from './DateOnly';

/**
 * Parse CSV text content into an array of objects
 * @param {string} csvText - The raw CSV text content
 * @returns {Array} Array of parsed objects with headers as keys
 */
export function parseCSV(csvText) {
  if (typeof csvText !== 'string') {
    throw new Error('CSV text must be a non-empty string');
  }

  if (csvText.trim().length === 0) {
    throw new Error('CSV is empty');
  }

  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  // Parse the header line
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  if (headers.length === 0 || headers.every(h => h === '')) {
    throw new Error('CSV has no headers');
  }

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) {
      continue; // Skip empty lines
    }

    const values = parseCSVLine(line).map(v => v.trim());
    
    // Create object mapping headers to values
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 * @param {string} line - A single CSV line
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add the last field
  fields.push(currentField);

  return fields;
}

/**
 * Convert raw CSV row data to a Workout object
 * @param {Object} row - Raw CSV row object
 * @returns {Object} Workout object with normalized data and types
 */
export function rowToWorkout(row) {
  if (!row || typeof row !== 'object') {
    throw new Error('Row must be an object');
  }

  const workout = {
    title: row.Title || '',
    workoutType: row.WorkoutType || '',
    description: row.WorkoutDescription || '',
    plannedDuration: parseFloat(row.PlannedDuration) || 0,
    plannedDistance: parseFloat(row.PlannedDistanceInMeters) || 0,
    workoutDate: parseWorkoutDate(row.WorkoutDay),
    coachComments: row.CoachComments || '',
    athleteComments: row.AthleteComments || '',
    
    // Optional fields from completed workouts
    actualDistance: parseFloat(row.DistanceInMeters) || null,
    powerAverage: parseFloat(row.PowerAverage) || null,
    powerMax: parseFloat(row.PowerMax) || null,
    heartRateAverage: parseFloat(row.HeartRateAverage) || null,
    heartRateMax: parseFloat(row.HeartRateMax) || null,
    tss: parseFloat(row.TSS) || null,
    if: parseFloat(row.IF) || null,
  };

  return workout;
}

/**
 * Parse the WorkoutDay field (YYYY-MM-DD format)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {DateOnly|null} DateOnly object or null if invalid
 */
function parseWorkoutDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  try {
    return DateOnly.fromString(dateString);
  } catch (error) {
    return null;
  }
}

/**
 * Parse a CSV file and return an array of Workout objects
 * @param {string} csvText - The raw CSV text
 * @returns {Array} Array of Workout objects
 */
export function parseWorkoutsCSV(csvText) {
  const rows = parseCSV(csvText);
  return rows.map(row => rowToWorkout(row));
}

/**
 * Filter workouts by date range
 * @param {Array} workouts - Array of workout objects
 * @param {DateOnly} startDate - Start date (inclusive)
 * @param {DateOnly} endDate - End date (inclusive)
 * @returns {Array} Filtered workouts
 */
export function filterWorkoutsByDateRange(workouts, startDate, endDate) {
  if (!Array.isArray(workouts)) {
    throw new Error('Workouts must be an array');
  }

  if (!(startDate instanceof DateOnly) || !(endDate instanceof DateOnly)) {
    throw new Error('Start and end dates must be DateOnly objects');
  }

  return workouts.filter(workout => {
    if (!workout.workoutDate) {
      return false;
    }
    return workout.workoutDate.isBetween(startDate, endDate);
  });
}

/**
 * Group workouts by date
 * @param {Array} workouts - Array of workout objects
 * @returns {Object} Object with date strings as keys (YYYY-MM-DD) and arrays of workouts as values
 */
export function groupWorkoutsByDate(workouts) {
  if (!Array.isArray(workouts)) {
    throw new Error('Workouts must be an array');
  }

  const grouped = {};

  workouts.forEach(workout => {
    if (workout.workoutDate) {
      const dateKey = workout.workoutDate.toISOString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(workout);
    }
  });

  return grouped;
}
