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

  const handleDrop = (e, dayObj, timeSlot = null, onWorkoutDateChange, onWorkoutTimeOfDayChange) => {
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
    
    // Update date if changed
    if (!sameDay && onWorkoutDateChange) {
      onWorkoutDateChange(draggedWorkout.id, newDate);
    }
    
    // Update time of day if changed
    if (timeSlotChanged && onWorkoutTimeOfDayChange) {
      onWorkoutTimeOfDayChange(draggedWorkout.id, timeSlot);
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
