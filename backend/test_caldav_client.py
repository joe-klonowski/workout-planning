"""
Tests for CalDAV client
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, call
from datetime import date, datetime
from caldav_client import CalDAVClient
import caldav


class TestCalDAVClient:
    """Tests for CalDAVClient class"""
    
    @pytest.fixture
    def mock_caldav_client(self):
        """Mock caldav.DAVClient"""
        with patch('caldav_client.caldav.DAVClient') as mock:
            yield mock
    
    @pytest.fixture
    def client(self):
        """Create a CalDAVClient instance for testing"""
        return CalDAVClient(
            url="https://caldav.example.com",
            username="test@example.com",
            password="test-password"
        )
    
    def test_init(self, client):
        """Test client initialization"""
        assert client.url == "https://caldav.example.com"
        assert client.username == "test@example.com"
        assert client.password == "test-password"
        assert client._client is None
        assert client._principal is None
        assert client._calendar is None
    
    def test_connect_success(self, client, mock_caldav_client):
        """Test successful connection to CalDAV server"""
        mock_principal = Mock()
        mock_dav_client = Mock()
        mock_dav_client.principal.return_value = mock_principal
        mock_caldav_client.return_value = mock_dav_client
        
        client.connect()
        
        mock_caldav_client.assert_called_once_with(
            url="https://caldav.example.com",
            username="test@example.com",
            password="test-password"
        )
        assert client._client == mock_dav_client
        assert client._principal == mock_principal
    
    def test_connect_failure(self, client, mock_caldav_client):
        """Test connection failure"""
        mock_caldav_client.side_effect = Exception("Connection failed")
        
        with pytest.raises(Exception, match="Connection failed"):
            client.connect()
    
    def test_get_calendars_not_connected(self, client):
        """Test get_calendars when not connected"""
        with pytest.raises(RuntimeError, match="Not connected"):
            client.get_calendars()
    
    def test_get_calendars_success(self, client):
        """Test getting list of calendars"""
        mock_cal1 = Mock()
        mock_cal1.name = "Personal"
        mock_cal1.url = "https://caldav.example.com/calendars/personal"
        
        mock_cal2 = Mock()
        mock_cal2.name = "Work"
        mock_cal2.url = "https://caldav.example.com/calendars/work"
        
        mock_principal = Mock()
        mock_principal.calendars.return_value = [mock_cal1, mock_cal2]
        client._principal = mock_principal
        
        calendars = client.get_calendars()
        
        assert len(calendars) == 2
        assert calendars[0] == {
            'name': 'Personal',
            'url': 'https://caldav.example.com/calendars/personal'
        }
        assert calendars[1] == {
            'name': 'Work',
            'url': 'https://caldav.example.com/calendars/work'
        }
    
    def test_select_calendar_not_connected(self, client):
        """Test select_calendar when not connected"""
        with pytest.raises(RuntimeError, match="Not connected"):
            client.select_calendar()
    
    def test_select_calendar_no_calendars(self, client):
        """Test select_calendar when no calendars exist"""
        mock_principal = Mock()
        mock_principal.calendars.return_value = []
        client._principal = mock_principal
        
        with pytest.raises(RuntimeError, match="No calendars found"):
            client.select_calendar()
    
    def test_select_calendar_default(self, client):
        """Test selecting default (first) calendar"""
        mock_cal = Mock()
        mock_cal.name = "Personal"
        
        mock_principal = Mock()
        mock_principal.calendars.return_value = [mock_cal]
        client._principal = mock_principal
        
        client.select_calendar()
        
        assert client._calendar == mock_cal
    
    def test_select_calendar_by_name(self, client):
        """Test selecting calendar by name"""
        mock_cal1 = Mock()
        mock_cal1.name = "Personal"
        
        mock_cal2 = Mock()
        mock_cal2.name = "Work"
        
        mock_principal = Mock()
        mock_principal.calendars.return_value = [mock_cal1, mock_cal2]
        client._principal = mock_principal
        
        client.select_calendar("Work")
        
        assert client._calendar == mock_cal2
    
    def test_select_calendar_not_found(self, client):
        """Test selecting calendar that doesn't exist"""
        mock_cal = Mock()
        mock_cal.name = "Personal"
        
        mock_principal = Mock()
        mock_principal.calendars.return_value = [mock_cal]
        client._principal = mock_principal
        
        with pytest.raises(RuntimeError, match="Calendar 'NonExistent' not found"):
            client.select_calendar("NonExistent")
    
    def test_create_workout_event_no_calendar(self, client):
        """Test create_workout_event when no calendar selected"""
        with pytest.raises(RuntimeError, match="No calendar selected"):
            client.create_workout_event(date(2026, 1, 15), [])
    
    def test_create_workout_event_single_workout(self, client):
        """Test creating event with single workout"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-123"
        mock_calendar.save_event.return_value = mock_event
        client._calendar = mock_calendar
        
        workouts = [
            {
                'workoutType': 'Run',
                'workoutLocation': 'outdoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.5
            }
        ]
        
        event_id = client.create_workout_event(date(2026, 1, 15), workouts)
        
        assert event_id == "event-123"
        mock_calendar.save_event.assert_called_once()
        
        # Verify the iCalendar event data
        ical_data = mock_calendar.save_event.call_args[0][0]
        assert "SUMMARY:Joe workout schedule" in ical_data
        assert "DTSTART;VALUE=DATE:20260115" in ical_data
        assert "DTEND;VALUE=DATE:20260116" in ical_data
        assert "Type: Run" in ical_data
        assert "Location: outdoor" in ical_data
        assert "Time: morning" in ical_data
        assert "Duration: 1 hour 30 minutes" in ical_data
    
    def test_create_workout_event_multiple_workouts(self, client):
        """Test creating event with multiple workouts"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-456"
        mock_calendar.save_event.return_value = mock_event
        client._calendar = mock_calendar
        
        workouts = [
            {
                'workoutType': 'Swim',
                'workoutLocation': 'indoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.0
            },
            {
                'workoutType': 'Bike',
                'workoutLocation': None,
                'timeOfDay': 'afternoon',
                'plannedDuration': 2.5
            }
        ]
        
        event_id = client.create_workout_event(date(2026, 1, 16), workouts)
        
        assert event_id == "event-456"
        
        # Verify the iCalendar event data
        ical_data = mock_calendar.save_event.call_args[0][0]
        assert "Type: Swim" in ical_data
        assert "Location: indoor" in ical_data
        assert "Duration: 1 hour" in ical_data
        assert "Type: Bike" in ical_data
        assert "Location: " not in ical_data or "Location: None" not in ical_data  # Location should not appear for Bike
        assert "Duration: 2 hours 30 minutes" in ical_data
    
    def test_create_workout_event_duration_formatting(self, client):
        """Test various duration formats"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-789"
        mock_calendar.save_event.return_value = mock_event
        client._calendar = mock_calendar
        
        # Test case 1: Exact hours
        workouts = [{'workoutType': 'Run', 'timeOfDay': 'morning', 'plannedDuration': 2.0}]
        client.create_workout_event(date(2026, 1, 17), workouts)
        ical_data = mock_calendar.save_event.call_args[0][0]
        assert "Duration: 2 hours" in ical_data
        
        # Test case 2: Only minutes
        workouts = [{'workoutType': 'Run', 'timeOfDay': 'morning', 'plannedDuration': 0.5}]
        client.create_workout_event(date(2026, 1, 18), workouts)
        ical_data = mock_calendar.save_event.call_args[0][0]
        assert "Duration: 30 minutes" in ical_data
        
        # Test case 3: No duration
        workouts = [{'workoutType': 'Run', 'timeOfDay': 'morning'}]
        client.create_workout_event(date(2026, 1, 19), workouts)
        ical_data = mock_calendar.save_event.call_args[0][0]
        assert "Duration:" not in ical_data
    
    def test_delete_all_workout_events_no_calendar(self, client):
        """Test delete_all_workout_events when no calendar selected"""
        with pytest.raises(RuntimeError, match="No calendar selected"):
            client.delete_all_workout_events()
    
    def test_delete_all_workout_events(self, client):
        """Test deleting all workout events"""
        # Create mock events
        mock_workout_event1 = Mock()
        mock_workout_event1.data = "BEGIN:VEVENT\nSUMMARY:Joe workout schedule\nEND:VEVENT"
        
        mock_workout_event2 = Mock()
        mock_workout_event2.data = "BEGIN:VEVENT\nSUMMARY:Joe workout schedule\nEND:VEVENT"
        
        mock_other_event = Mock()
        mock_other_event.data = "BEGIN:VEVENT\nSUMMARY:Meeting\nEND:VEVENT"
        
        mock_calendar = Mock()
        mock_calendar.events.return_value = [mock_workout_event1, mock_workout_event2, mock_other_event]
        client._calendar = mock_calendar
        
        deleted_count = client.delete_all_workout_events()
        
        assert deleted_count == 2
        mock_workout_event1.delete.assert_called_once()
        mock_workout_event2.delete.assert_called_once()
        mock_other_event.delete.assert_not_called()
    
    def test_delete_all_workout_events_with_errors(self, client):
        """Test deleting events when some deletions fail"""
        mock_event1 = Mock()
        mock_event1.data = "BEGIN:VEVENT\nSUMMARY:Joe workout schedule\nEND:VEVENT"
        
        mock_event2 = Mock()
        mock_event2.data = "BEGIN:VEVENT\nSUMMARY:Joe workout schedule\nEND:VEVENT"
        mock_event2.delete.side_effect = Exception("Delete failed")
        
        mock_calendar = Mock()
        mock_calendar.events.return_value = [mock_event1, mock_event2]
        client._calendar = mock_calendar
        
        deleted_count = client.delete_all_workout_events()
        
        # Should still delete the first event successfully
        assert deleted_count == 1
        mock_event1.delete.assert_called_once()
    
    def test_export_workout_plan_no_calendar(self, client):
        """Test export_workout_plan when no calendar selected"""
        with pytest.raises(RuntimeError, match="No calendar selected"):
            client.export_workout_plan({})
    
    def test_export_workout_plan_success(self, client):
        """Test exporting a complete workout plan"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-id"
        mock_calendar.save_event.return_value = mock_event
        client._calendar = mock_calendar
        
        workouts_by_date = {
            date(2026, 1, 15): [
                {'workoutType': 'Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
            ],
            date(2026, 1, 16): [
                {'workoutType': 'Swim', 'timeOfDay': 'morning', 'plannedDuration': 1.5},
                {'workoutType': 'Bike', 'timeOfDay': 'afternoon', 'plannedDuration': 2.0}
            ],
            date(2026, 1, 17): []  # No workouts, should not create event
        }
        
        created_count = client.export_workout_plan(workouts_by_date)
        
        assert created_count == 2
        assert mock_calendar.save_event.call_count == 2
    
    def test_export_workout_plan_with_errors(self, client):
        """Test exporting when some event creations fail"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-id"
        
        # First call succeeds, second fails, third succeeds
        mock_calendar.save_event.side_effect = [mock_event, Exception("Save failed"), mock_event]
        client._calendar = mock_calendar
        
        workouts_by_date = {
            date(2026, 1, 15): [{'workoutType': 'Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}],
            date(2026, 1, 16): [{'workoutType': 'Swim', 'timeOfDay': 'morning', 'plannedDuration': 1.0}],
            date(2026, 1, 17): [{'workoutType': 'Bike', 'timeOfDay': 'morning', 'plannedDuration': 1.0}]
        }
        
        created_count = client.export_workout_plan(workouts_by_date)
        
        # Should successfully create 2 out of 3 events
        assert created_count == 2
    
    def test_disconnect(self, client):
        """Test disconnecting from server"""
        client._client = Mock()
        client._principal = Mock()
        client._calendar = Mock()
        
        client.disconnect()
        
        assert client._client is None
        assert client._principal is None
        assert client._calendar is None
    
    def test_icalendar_format(self, client):
        """Test that iCalendar format is valid"""
        mock_calendar = Mock()
        mock_event = Mock()
        mock_event.id = "event-id"
        mock_calendar.save_event.return_value = mock_event
        client._calendar = mock_calendar
        
        workouts = [
            {
                'workoutType': 'Run',
                'workoutLocation': 'outdoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.5
            }
        ]
        
        client.create_workout_event(date(2026, 1, 15), workouts)
        
        ical_data = mock_calendar.save_event.call_args[0][0]
        
        # Verify iCalendar structure
        assert ical_data.startswith("BEGIN:VCALENDAR")
        assert "VERSION:2.0" in ical_data
        assert "BEGIN:VEVENT" in ical_data
        assert "END:VEVENT" in ical_data
        assert ical_data.strip().endswith("END:VCALENDAR")
        
        # Verify required fields
        assert "UID:" in ical_data
        assert "DTSTART;VALUE=DATE:" in ical_data
        assert "DTEND;VALUE=DATE:" in ical_data
        assert "SUMMARY:" in ical_data
        assert "DESCRIPTION:" in ical_data
