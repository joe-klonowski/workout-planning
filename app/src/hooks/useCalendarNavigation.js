import { useState } from 'react';

/**
 * Custom hook for managing calendar navigation state and handlers
 * @param {DateOnly} initialDate - The initial date to display
 * @returns {Object} Navigation state and handlers
 */
export function useCalendarNavigation(initialDate) {
  const [currentDate, setCurrentDate] = useState(initialDate.toDate());

  const goToPreviousMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return {
    currentDate,
    setCurrentDate,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
