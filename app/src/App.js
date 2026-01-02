import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import { API_ENDPOINTS } from './config/api';
import { DateOnly } from './utils/DateOnly';
import './App.css';

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load workouts from backend API
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        console.log('Fetching workouts from:', API_ENDPOINTS.WORKOUTS);
        const response = await fetch(API_ENDPOINTS.WORKOUTS);
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to load workouts: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data);
        console.log('Number of workouts:', data.workouts?.length);
        
        // Transform API data to match existing workout format
        const transformedWorkouts = data.workouts.map(workout => {
          // Parse the date string (YYYY-MM-DD) into DateOnly object
          const [year, month, day] = workout.workoutDay.split('-').map(Number);
          
          return {
            title: workout.title,
            workoutType: workout.workoutType,
            workoutDescription: workout.workoutDescription,
            plannedDuration: workout.plannedDuration,
            plannedDistanceInMeters: workout.plannedDistanceInMeters,
            workoutDay: workout.workoutDay,
            workoutDate: new DateOnly(year, month, day),
            coachComments: workout.coachComments,
          };
        });
        
        console.log('Transformed workouts:', transformedWorkouts.length);
        setWorkouts(transformedWorkouts);
        setError(null);
      } catch (err) {
        const errorMessage = err.message || 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading workouts:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
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
