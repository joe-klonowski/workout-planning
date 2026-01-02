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
            id: workout.id,
            title: workout.title,
            workoutType: workout.workoutType,
            workoutDescription: workout.workoutDescription,
            plannedDuration: workout.plannedDuration,
            plannedDistanceInMeters: workout.plannedDistanceInMeters,
            workoutDay: workout.workoutDay,
            workoutDate: new DateOnly(year, month, day),
            coachComments: workout.coachComments,
            // Selection state - default to selected if no selection exists
            isSelected: workout.selection ? workout.selection.isSelected : true,
          };
        });
        
        console.log('Transformed workouts:', transformedWorkouts.length);
        setWorkouts(transformedWorkouts);
        setError(null);
      } catch (err) {
        let errorMessage;
        
        // Check if this is a network error (backend not running)
        if (err instanceof TypeError && err.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend server at ${API_ENDPOINTS.WORKOUTS}. Make sure the backend is running.`;
        } else if (err.message.includes('Failed to load workouts')) {
          errorMessage = `${err.message}. The backend server responded with an error.`;
        } else {
          errorMessage = err.message || 'Unknown error occurred';
        }
        
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

  // Handle workout selection toggle
  const handleWorkoutSelection = async (workoutId, isSelected) => {
    try {
      const response = await fetch(API_ENDPOINTS.SELECTIONS(workoutId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSelected }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update selection: ${response.status}`);
      }

      // Update local state
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(workout =>
          workout.id === workoutId ? { ...workout, isSelected } : workout
        )
      );
    } catch (err) {
      console.error('Error updating workout selection:', err);
      alert('Failed to update workout selection. Please try again.');
    }
  };

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
            <Calendar 
              workouts={workouts} 
              onWorkoutSelectionToggle={handleWorkoutSelection}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
