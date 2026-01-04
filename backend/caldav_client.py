"""
CalDAV client for exporting workouts to Apple Calendar
"""
import caldav
from caldav.elements import dav, cdav
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class CalDAVClient:
    """
    Client for interacting with CalDAV servers (e.g., Apple Calendar/iCloud)
    
    This client allows exporting workout plans to calendar services that support CalDAV.
    """
    
    def __init__(self, url: str, username: str, password: str):
        """
        Initialize CalDAV client
        
        Args:
            url: CalDAV server URL (e.g., 'https://caldav.icloud.com/')
            username: Calendar service username/email
            password: App-specific password or account password
        """
        self.url = url
        self.username = username
        self.password = password
        self._client = None
        self._principal = None
        self._calendar = None
    
    def connect(self):
        """
        Connect to CalDAV server and authenticate
        
        Raises:
            caldav.lib.error.AuthorizationError: If authentication fails
            Exception: For other connection errors
        """
        try:
            self._client = caldav.DAVClient(
                url=self.url,
                username=self.username,
                password=self.password
            )
            self._principal = self._client.principal()
            logger.info(f"Successfully connected to CalDAV server at {self.url}")
        except Exception as e:
            logger.error(f"Failed to connect to CalDAV server: {e}")
            raise
    
    def get_calendars(self) -> List[Dict[str, str]]:
        """
        Get list of available calendars
        
        Returns:
            List of dictionaries with calendar 'name' and 'url'
            
        Raises:
            RuntimeError: If not connected to server
        """
        if not self._principal:
            raise RuntimeError("Not connected. Call connect() first.")
        
        calendars = self._principal.calendars()
        return [
            {
                'name': cal.name,
                'url': str(cal.url)
            }
            for cal in calendars
        ]
    
    def select_calendar(self, calendar_name: Optional[str] = None):
        """
        Select a calendar to work with
        
        Args:
            calendar_name: Name of calendar to select. If None, uses first available calendar.
            
        Raises:
            RuntimeError: If not connected or calendar not found
        """
        if not self._principal:
            raise RuntimeError("Not connected. Call connect() first.")
        
        calendars = self._principal.calendars()
        
        if not calendars:
            raise RuntimeError("No calendars found")
        
        if calendar_name:
            for cal in calendars:
                if cal.name == calendar_name:
                    self._calendar = cal
                    logger.info(f"Selected calendar: {calendar_name}")
                    return
            raise RuntimeError(f"Calendar '{calendar_name}' not found")
        else:
            self._calendar = calendars[0]
            logger.info(f"Selected default calendar: {self._calendar.name}")
    
    def create_workout_event(self, event_date: date, workouts: List[Dict]) -> str:
        """
        Create an all-day event for a day with workouts
        
        Args:
            event_date: Date for the event
            workouts: List of workout dictionaries containing:
                - workoutType: Type of workout (swim, bike, run, etc.)
                - workoutLocation: Location (e.g., indoor, outdoor) or None
                - timeOfDay: Time of day (e.g., morning, afternoon, evening)
                - plannedDuration: Duration in hours
        
        Returns:
            Event UID
            
        Raises:
            RuntimeError: If calendar not selected
        """
        if not self._calendar:
            raise RuntimeError("No calendar selected. Call select_calendar() first.")
        
        # Format workout notes
        notes_lines = []
        for workout in workouts:
            workout_info = []
            
            # Workout type
            workout_type = workout.get('workoutType', 'Unknown')
            workout_info.append(f"Type: {workout_type}")
            
            # Location (if specified)
            location = workout.get('workoutLocation')
            if location:
                workout_info.append(f"Location: {location}")
            
            # Time of day
            time_of_day = workout.get('timeOfDay', 'Not specified')
            workout_info.append(f"Time: {time_of_day}")
            
            # Duration
            duration_hours = workout.get('plannedDuration')
            if duration_hours:
                hours = int(duration_hours)
                minutes = int((duration_hours - hours) * 60)
                if hours > 0 and minutes > 0:
                    duration_str = f"{hours} hour{'s' if hours != 1 else ''} {minutes} minutes"
                elif hours > 0:
                    duration_str = f"{hours} hour{'s' if hours != 1 else ''}"
                else:
                    duration_str = f"{minutes} minutes"
                workout_info.append(f"Duration: {duration_str}")
            
            notes_lines.append("- " + ", ".join(workout_info))
        
        notes = "\n".join(notes_lines)
        
        # Escape the notes for iCalendar format
        # In iCalendar, newlines in DESCRIPTION must be encoded as literal \n
        # Also escape backslashes and commas if needed
        notes_escaped = notes.replace("\\", "\\\\").replace("\n", "\\n")
        
        # Create iCalendar event
        # All-day events use DATE format (no time component)
        event_start = event_date.strftime("%Y%m%d")
        event_end = (event_date + timedelta(days=1)).strftime("%Y%m%d")
        
        ical_event = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Workout Planner//EN
BEGIN:VEVENT
UID:{datetime.now().strftime('%Y%m%d%H%M%S')}-{event_date.strftime('%Y%m%d')}@workout-planner
DTSTART;VALUE=DATE:{event_start}
DTEND;VALUE=DATE:{event_end}
SUMMARY:Joe workout schedule
DESCRIPTION:{notes_escaped}
END:VEVENT
END:VCALENDAR"""
        
        # Save event to calendar
        event = self._calendar.save_event(ical_event)
        logger.info(f"Created workout event for {event_date}")
        
        return event.id
    
    def delete_all_workout_events(self):
        """
        Delete all events with summary "Joe workout schedule"
        
        This is useful for clearing out old workout plans before exporting a new one.
        
        Returns:
            Number of events deleted
        """
        if not self._calendar:
            raise RuntimeError("No calendar selected. Call select_calendar() first.")
        
        deleted_count = 0
        
        # Search for all events (we'll filter by summary)
        events = self._calendar.events()
        
        for event in events:
            try:
                ical_data = event.data
                # Check if this is a workout schedule event
                if "SUMMARY:Joe workout schedule" in ical_data:
                    event.delete()
                    deleted_count += 1
            except Exception as e:
                logger.warning(f"Error processing event: {e}")
                continue
        
        logger.info(f"Deleted {deleted_count} workout events")
        return deleted_count
    
    def delete_workout_events_in_range(self, start_date: date, end_date: date):
        """
        Delete workout events within a specific date range
        
        This is useful for re-exporting a specific week or month without affecting
        other workout events in the calendar.
        
        Args:
            start_date: Start date of range (inclusive)
            end_date: End date of range (inclusive)
            
        Returns:
            Number of events deleted
        """
        if not self._calendar:
            raise RuntimeError("No calendar selected. Call select_calendar() first.")
        
        deleted_count = 0
        
        # Search for events in the date range
        # CalDAV search expects datetime objects
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        events = self._calendar.search(start=start_datetime, end=end_datetime, expand=True)
        
        for event in events:
            try:
                ical_data = event.data
                # Check if this is a workout schedule event
                if "SUMMARY:Joe workout schedule" in ical_data:
                    event.delete()
                    deleted_count += 1
            except Exception as e:
                logger.warning(f"Error processing event: {e}")
                continue
        
        logger.info(f"Deleted {deleted_count} workout events in range {start_date} to {end_date}")
        return deleted_count
    
    def export_workout_plan(self, workouts_by_date: Dict[date, List[Dict]]):
        """
        Export a complete workout plan to calendar
        
        Creates one all-day event per day that has workouts.
        
        Args:
            workouts_by_date: Dictionary mapping dates to lists of workout dictionaries
            
        Returns:
            Number of events created
        """
        if not self._calendar:
            raise RuntimeError("No calendar selected. Call select_calendar() first.")
        
        created_count = 0
        
        for event_date, workouts in workouts_by_date.items():
            if workouts:  # Only create events for days with workouts
                try:
                    self.create_workout_event(event_date, workouts)
                    created_count += 1
                except Exception as e:
                    logger.error(f"Failed to create event for {event_date}: {e}")
        
        logger.info(f"Exported {created_count} workout events to calendar")
        return created_count
    
    def disconnect(self):
        """
        Disconnect from CalDAV server
        """
        self._client = None
        self._principal = None
        self._calendar = None
        logger.info("Disconnected from CalDAV server")
