import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import Login from './components/Login';
import { API_ENDPOINTS, apiCall } from './config/api';
import { DateOnly } from './utils/DateOnly';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triClubSchedule, setTriClubSchedule] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          // Verify token is still valid
          const response = await apiCall(API_ENDPOINTS.VERIFY);
          
          if (!response.ok) {
            // Token is invalid or expired
            localStorage.removeItem('auth_token');
            setIsAuthenticated(false);
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          
          const data = await response.json();
          setIsAuthenticated(true);
          setCurrentUser(data.user);
        } catch (err) {
          console.error('Error verifying token:', err);
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWorkouts([]);
    setTriClubSchedule(null);
  };

  // Load workouts from backend API (including custom workouts)
  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't load workouts if not authenticated
    }

    const loadWorkouts = async () => {
      try {
        console.log('Fetching workouts from:', API_ENDPOINTS.WORKOUTS);
        const response = await apiCall(API_ENDPOINTS.WORKOUTS);
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to load workouts: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data);
        console.log('Number of workouts:', data.workouts?.length);
        
        // Transform API data to match existing workout format
        const transformedWorkouts = data.workouts.map(workout => {
          // Use currentPlanDay if it exists (user moved it), otherwise use originallyPlannedDay (original planned date)
          const displayDate = workout.selection?.currentPlanDay || workout.originallyPlannedDay;
          const [year, month, day] = displayDate.split('-').map(Number);
          
          return {
            id: workout.id,
            title: workout.title,
            workoutType: workout.workoutType,
            workoutDescription: workout.workoutDescription,
            plannedDuration: workout.plannedDuration,
            plannedDistanceInMeters: workout.plannedDistanceInMeters,
            tss: workout.tss,
            originallyPlannedDay: workout.originallyPlannedDay, // Original planned day from coach
            currentPlanDay: workout.selection?.currentPlanDay, // User's chosen day (if moved)
            workoutDate: new DateOnly(year, month, day), // Display date for calendar
            coachComments: workout.coachComments,
            // Selection state - default to selected if no selection exists
            isSelected: workout.selection ? workout.selection.isSelected : true,
            timeOfDay: workout.selection?.timeOfDay, // Time of day (morning, afternoon, evening, or null)
            workoutLocation: workout.selection?.workoutLocation, // Workout location (indoor, outdoor, or null)
            isCustom: workout.isCustom || false // Flag to indicate custom workout
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
      }
    };

    loadWorkouts();
  }, [isAuthenticated]);

  // Load tri club schedule
  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't load schedule if not authenticated
    }

    const loadTriClubSchedule = async () => {
      try {
        console.log('Fetching tri club schedule from:', API_ENDPOINTS.TRI_CLUB_SCHEDULE);
        const response = await apiCall(API_ENDPOINTS.TRI_CLUB_SCHEDULE);
        if (!response.ok) {
          console.warn('Failed to load tri club schedule:', response.status);
          return; // Silently fail - schedule is optional
        }
        const data = await response.json();
        console.log('Received tri club schedule:', data);
        setTriClubSchedule(data);
      } catch (err) {
        console.warn('Error loading tri club schedule:', err);
        // Silently fail - schedule is optional
      }
    };

    loadTriClubSchedule();
  }, [isAuthenticated]);

  // Handle workout selection toggle
  const handleWorkoutSelection = async (workoutId, isSelected) => {
    try {
      const response = await apiCall(API_ENDPOINTS.SELECTIONS(workoutId), {
        method: 'PUT',
        body: JSON.stringify({ isSelected }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update selection: ${response.status}`);
      }

      // Update local state - when deselecting, also clear timeOfDay
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(workout =>
          workout.id === workoutId 
            ? { ...workout, isSelected, timeOfDay: isSelected ? workout.timeOfDay : null } 
            : workout
        )
      );
    } catch (err) {
      console.error('Error updating workout selection:', err);
      alert('Failed to update workout selection. Please try again.');
    }
  };

  // Handle workout date change (drag and drop)
  const handleWorkoutDateChange = async (workoutId, newDate) => {
    try {
      // newDate is a Date object, convert to YYYY-MM-DD format
      const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      
      // Use selections endpoint for all workouts
      const response = await apiCall(API_ENDPOINTS.SELECTIONS(workoutId), {
        method: 'PUT',
        body: JSON.stringify({ currentPlanDay: dateStr }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workout date: ${response.status}`);
      }

      // Update local state
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(workout => {
          if (workout.id === workoutId) {
            return {
              ...workout,
              currentPlanDay: dateStr,
              workoutDate: new DateOnly(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate())
            };
          }
          return workout;
        })
      );
    } catch (err) {
      console.error('Error updating workout date:', err);
      alert('Failed to move workout. Please try again.');
    }
  };

  // Handle workout time of day change (drag and drop to time slot)
  const handleWorkoutTimeOfDayChange = async (workoutId, timeOfDay) => {
    try {
      // Use selections endpoint for all workouts
      const response = await apiCall(API_ENDPOINTS.SELECTIONS(workoutId), {
        method: 'PUT',
        body: JSON.stringify({ timeOfDay: timeOfDay === 'unscheduled' ? null : timeOfDay }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workout time: ${response.status}`);
      }

      // Update local state
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(workout => {
          if (workout.id === workoutId) {
            return {
              ...workout,
              timeOfDay: timeOfDay === 'unscheduled' ? null : timeOfDay
            };
          }
          return workout;
        })
      );
    } catch (err) {
      console.error('Error updating workout time:', err);
      alert('Failed to update workout time. Please try again.');
    }
  };

  // Handle workout location change
  const handleWorkoutLocationChange = async (workoutId, workoutLocation) => {
    try {
      const response = await apiCall(API_ENDPOINTS.SELECTIONS(workoutId), {
        method: 'PUT',
        body: JSON.stringify({ workoutLocation }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workout location: ${response.status}`);
      }

      // Update local state
      setWorkouts(prevWorkouts =>
        prevWorkouts.map(workout => {
          if (workout.id === workoutId) {
            return {
              ...workout,
              workoutLocation
            };
          }
          return workout;
        })
      );
    } catch (err) {
      console.error('Error updating workout location:', err);
      alert('Failed to update workout location. Please try again.');
    }
  };

  // Handle export to calendar
  const handleExportToCalendar = async (dateRange) => {
    try {
      const response = await apiCall(API_ENDPOINTS.EXPORT_TO_CALENDAR, {
        method: 'POST',
        body: JSON.stringify(dateRange),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to export: ${response.status}`);
      }

      const result = await response.json();
      alert(`Successfully exported ${result.eventsCreated} workout events to Apple Calendar!`);
    } catch (err) {
      console.error('Error exporting to calendar:', err);
      throw err; // Re-throw so the modal can display the error
    }
  };

  // Handle adding custom workout
  const handleAddCustomWorkout = async (workoutData) => {
    try {
      // Transform workoutData to match unified API format
      const apiData = {
        title: workoutData.title,
        workoutType: workoutData.workoutType,
        workoutDescription: workoutData.description,
        originallyPlannedDay: workoutData.plannedDate,
        plannedDuration: workoutData.plannedDuration,
        plannedDistanceInMeters: workoutData.plannedDistanceInMeters,
        tss: workoutData.tss,
        timeOfDay: workoutData.timeOfDay,
        workoutLocation: workoutData.workoutLocation,
        isCustom: true
      };
      
      const response = await apiCall(API_ENDPOINTS.WORKOUTS, {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create custom workout: ${response.status}`);
      }

      const newWorkout = await response.json();
      
      // Transform and add to local state
      const displayDate = newWorkout.selection?.currentPlanDay || newWorkout.originallyPlannedDay;
      const [year, month, day] = displayDate.split('-').map(Number);
      const transformedWorkout = {
        id: newWorkout.id,
        title: newWorkout.title,
        workoutType: newWorkout.workoutType,
        workoutDescription: newWorkout.workoutDescription,
        plannedDuration: newWorkout.plannedDuration,
        plannedDistanceInMeters: newWorkout.plannedDistanceInMeters,
        tss: newWorkout.tss,
        originallyPlannedDay: newWorkout.originallyPlannedDay,
        currentPlanDay: newWorkout.selection?.currentPlanDay,
        workoutDate: new DateOnly(year, month, day),
        isSelected: true,
        timeOfDay: newWorkout.selection?.timeOfDay,
        workoutLocation: newWorkout.selection?.workoutLocation,
        isCustom: true
      };

      setWorkouts(prev => [...prev, transformedWorkout]);
    } catch (err) {
      console.error('Error creating custom workout:', err);
      alert('Failed to create custom workout. Please try again.');
    }
  };

  // Handle importing workouts from CSV file
  const handleImportWorkouts = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiCall(API_ENDPOINTS.IMPORT_WORKOUTS, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
        headers: {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to import workouts: ${response.status}`);
      }

      const result = await response.json();
      
      // Reload workouts to show newly imported ones
      const workoutsResponse = await apiCall(API_ENDPOINTS.WORKOUTS);
      if (!workoutsResponse.ok) {
        throw new Error(`Failed to reload workouts: ${workoutsResponse.status}`);
      }
      
      const data = await workoutsResponse.json();
      const transformedWorkouts = data.workouts.map(workout => {
        const displayDate = workout.selection?.currentPlanDay || workout.originallyPlannedDay;
        const [year, month, day] = displayDate.split('-').map(Number);
        
        return {
          id: workout.id,
          title: workout.title,
          workoutType: workout.workoutType,
          workoutDescription: workout.workoutDescription,
          plannedDuration: workout.plannedDuration,
          plannedDistanceInMeters: workout.plannedDistanceInMeters,
          tss: workout.tss,
          originallyPlannedDay: workout.originallyPlannedDay,
          currentPlanDay: workout.selection?.currentPlanDay,
          workoutDate: new DateOnly(year, month, day),
          isSelected: workout.selection?.isSelected ?? true,
          timeOfDay: workout.selection?.timeOfDay,
          workoutLocation: workout.selection?.workoutLocation,
          isCustom: workout.isCustom || false,
        };
      });
      
      setWorkouts(transformedWorkouts);
      
      return result;
    } catch (err) {
      console.error('Error importing workouts:', err);
      throw err;
    }
  };

  // Count custom workouts
  const customWorkoutsCount = workouts.filter(w => w.isCustom).length;

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>Workout Planner</h1>
            <p>Plan your workouts from TrainingPeaks</p>
          </div>
          <div className="header-user">
            <span>Welcome, {currentUser?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="App-main">
        {error && <p className="error">Error: {error}</p>}
        {!error && (
          <>
            <p className="workout-count">
              Loaded {workouts.length} workouts
              {customWorkoutsCount > 0 && ` (including ${customWorkoutsCount} custom)`}
            </p>
            <Calendar 
              workouts={workouts} 
              triClubSchedule={triClubSchedule}
              onWorkoutSelectionToggle={handleWorkoutSelection}
              onWorkoutDateChange={handleWorkoutDateChange}
              onWorkoutTimeOfDayChange={handleWorkoutTimeOfDayChange}
              onWorkoutLocationChange={handleWorkoutLocationChange}
              onExportToCalendar={handleExportToCalendar}
              onAddCustomWorkout={handleAddCustomWorkout}
              onImportWorkouts={handleImportWorkouts}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
