import { useState } from 'react';

/**
 * Custom hook for managing calendar drag-and-drop state and handlers
 * @returns {Object} Drag-and-drop state and handlers
 */
export function useCalendarDragDrop() {
  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [dragOverTimeSlot, setDragOverTimeSlot] = useState(null);

  const handleDragStart = (e, workout) => {
    setDraggedWorkout(workout);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.innerHTML);
    }
    // Add a subtle visual effect
    e.target.style.opacity = '0.4';
    // Show time slots after a tiny delay to let drag operation establish
    setTimeout(() => {
      setShowTimeSlots(true);
    }, 50);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedWorkout(null);
    setShowTimeSlots(false);
    setDragOverDate(null);
    setDragOverTimeSlot(null);
  };

  const handleDragOver = (e, date, timeSlot = null) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverDate(date.toISOString());
    setDragOverTimeSlot(timeSlot);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
    setDragOverTimeSlot(null);
  };

  const handleDrop = (e, dayObj, timeSlot = null, onWorkoutDateChange, onWorkoutTimeOfDayChange, onWorkoutSelectionUpdate) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    setDragOverTimeSlot(null);
    setShowTimeSlots(false);
    
    if (!draggedWorkout) {
      setDraggedWorkout(null);
      return;
    }
    
    // Create a Date object for the new date
    const newDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    
    // Compare the actual Date values to see if they're the same day
    const currentDate = draggedWorkout.workoutDate.toDate();
    const sameDay = currentDate.getFullYear() === dayObj.year &&
                    currentDate.getMonth() === dayObj.month &&
                    currentDate.getDate() === dayObj.day;
    
    // Check if time slot changed
    const timeSlotChanged = draggedWorkout.timeOfDay !== timeSlot;
    
    const dateChanged = !sameDay;
    const timeChanged = timeSlotChanged;

    // If either date or time changed, require the combined handler and call it with only the fields that changed
    if (dateChanged || timeChanged) {
      if (!onWorkoutSelectionUpdate) {
        throw new Error('onWorkoutSelectionUpdate is required; use the combined selection update API');
      }

      const updateFields = {};
      if (dateChanged) {
        updateFields.currentPlanDay = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      }
      if (timeChanged) {
        updateFields.timeOfDay = timeSlot; // may be null for unscheduled
      }

      onWorkoutSelectionUpdate(draggedWorkout.id, updateFields);
    } else {
      // No changes
    }
    
    setDraggedWorkout(null);
  };

  return {
    draggedWorkout,
    showTimeSlots,
    dragOverDate,
    dragOverTimeSlot,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
