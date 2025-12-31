import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import { parseWorkoutsCSV } from './utils/csvParser';
import './App.css';

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sample workouts from the CSV file
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await fetch('/workouts.csv');
        if (!response.ok) {
          throw new Error('Failed to load workouts CSV');
        }
        const csvText = await response.text();
        const parsedWorkouts = parseWorkoutsCSV(csvText);
        setWorkouts(parsedWorkouts);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error loading workouts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Workout Planner</h1>
        <p>Plan your workouts from TrainingPeaks</p>
      </header>

      <main className="App-main">
        {loading && <p className="loading">Loading workouts...</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading && !error && (
          <>
            <p className="workout-count">
              Loaded {workouts.length} workouts
            </p>
            <Calendar workouts={workouts} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
