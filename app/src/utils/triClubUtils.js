import { formatTime12Hour, getTimeSlot } from './workoutFormatters';

/**
 * Get tri club events for a specific day, grouped by time slot
 * @param {Date} dayDate - The date to get events for
 * @param {Object} triClubSchedule - Tri club schedule object with weekly events
 * @returns {Object} Events grouped by time slot
 */
export function getTriClubEventsByTimeSlot(dayDate, triClubSchedule) {
  if (!triClubSchedule || !triClubSchedule.schedule) {
    return {
      morning: [],
      afternoon: [],
      evening: [],
      unscheduled: []
    };
  }
  
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayDate.getDay()];
  const events = triClubSchedule.schedule[dayOfWeek] || [];
  
  const grouped = {
    morning: [],
    afternoon: [],
    evening: [],
    unscheduled: []
  };
  
  events.forEach(event => {
    const timeSlot = getTimeSlot(event.time);
    grouped[timeSlot].push({
      ...event,
      formattedTime: formatTime12Hour(event.time)
    });
  });
  
  return grouped;
}
