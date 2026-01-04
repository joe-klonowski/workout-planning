"""
Integration tests for CalDAV client with real Apple Calendar
These tests connect to a real CalDAV server and are skipped by default.

To run these tests:
    pytest -m integration

To skip these tests (default):
    pytest -m "not integration"
"""
import pytest
import os
from pathlib import Path
from datetime import date, timedelta
from dotenv import dotenv_values
from caldav_client import CalDAVClient


def load_caldav_credentials():
    """
    Load CalDAV credentials from config file
    
    Returns:
        dict with keys: url, username, password, calendar_name
        or None if file doesn't exist
    """
    config_path = Path.home() / ".config" / "workout-planner" / "caldav-credentials-apple.env"
    
    if not config_path.exists():
        return None
    
    # Load credentials from .env file
    credentials = dotenv_values(config_path)
    
    # Verify required fields are present
    required_fields = ['CALDAV_URL', 'CALDAV_USERNAME', 'CALDAV_PASSWORD']
    if not all(field in credentials for field in required_fields):
        return None
    
    return {
        'url': credentials['CALDAV_URL'],
        'username': credentials['CALDAV_USERNAME'],
        'password': credentials['CALDAV_PASSWORD'],
        'calendar_name': credentials.get('CALDAV_CALENDAR_NAME')  # Optional
    }


@pytest.fixture(scope="class")
def credentials():
    """Load credentials for integration tests"""
    creds = load_caldav_credentials()
    if not creds:
        pytest.skip("CalDAV credentials not found at ~/.config/workout-planner/caldav-credentials-apple.env")
    return creds


@pytest.fixture(scope="class")
def client(credentials):
    """Create a CalDAV client connected to Apple Calendar with a dedicated test calendar"""
    from datetime import datetime
    
    client = CalDAVClient(
        url=credentials['url'],
        username=credentials['username'],
        password=credentials['password']
    )
    
    # Connect to server
    client.connect()
    
    # Create a unique test calendar for this test run
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_calendar_name = f"Workout Planner Test {timestamp}"
    
    print(f"\nCreating test calendar: {test_calendar_name}")
    try:
        client._principal.make_calendar(name=test_calendar_name)
    except Exception as e:
        pytest.fail(f"Failed to create test calendar: {e}")
    
    # Select the test calendar
    client.select_calendar(test_calendar_name)
    print(f"\nUsing test calendar: {test_calendar_name}")
    
    yield client
    
    # Cleanup: Delete the entire test calendar after all tests complete
    print(f"\nDeleting test calendar: {test_calendar_name}")
    client._calendar.delete()
    print(f"Successfully deleted test calendar")
    
    client.disconnect()


@pytest.fixture(autouse=True)
def cleanup_events(client, request):
    """Clean up workout events after each test"""
    # This runs before each test (nothing to do)
    yield
    
    # After each test, clean up events if client fixture was used
    if 'client' in request.fixturenames:
        deleted = client.delete_all_workout_events()
        if deleted > 0:
            print(f"\n  Cleaned up {deleted} event(s) after test")


@pytest.mark.integration
class TestCalDAVIntegration:
    """Integration tests for CalDAV client with real Apple Calendar"""
    
    def test_connection(self, credentials):
        """Test that we can connect to Apple Calendar"""
        client = CalDAVClient(
            url=credentials['url'],
            username=credentials['username'],
            password=credentials['password']
        )
        
        # Should not raise an exception
        client.connect()
        assert client._principal is not None
        
        client.disconnect()
    
    def test_list_calendars(self, credentials):
        """Test that we can list available calendars"""
        client = CalDAVClient(
            url=credentials['url'],
            username=credentials['username'],
            password=credentials['password']
        )
        
        client.connect()
        calendars = client.get_calendars()
        
        assert len(calendars) > 0
        assert all('name' in cal for cal in calendars)
        assert all('url' in cal for cal in calendars)
        
        print(f"\nAvailable calendars: {[cal['name'] for cal in calendars]}")
        
        client.disconnect()
    
    def test_select_calendar(self, client, credentials):
        """Test that we can select a calendar"""
        # Client fixture already selected the test calendar
        assert client._calendar is not None
        
        # Verify a test calendar is selected (name starts with "Workout Planner Test")
        assert client._calendar.name.startswith("Workout Planner Test")
        
        print(f"\nConfirmed test calendar '{client._calendar.name}' is selected")
    
    def test_create_and_delete_workout_event(self, client):
        """Test creating and deleting a workout event"""
        # Use a date in the near future to avoid conflicts
        test_date = date.today() + timedelta(days=30)
        
        # Create a test workout event
        workouts = [
            {
                'workoutType': 'Integration Test Run',
                'workoutLocation': 'outdoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.0
            }
        ]
        
        # Create event
        event_id = client.create_workout_event(test_date, workouts)
        assert event_id is not None
        
        print(f"\nCreated test event with ID: {event_id}")
        
        # Verify event was created
        deleted_count = client.delete_all_workout_events()
        assert deleted_count >= 1
        
        print(f"Verified and deleted {deleted_count} workout event(s)")
    
    def test_create_multiple_workout_event(self, client):
        """Test creating an event with multiple workouts"""
        test_date = date.today() + timedelta(days=31)
        
        workouts = [
            {
                'workoutType': 'Integration Test Swim',
                'workoutLocation': 'indoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.0
            },
            {
                'workoutType': 'Integration Test Bike',
                'workoutLocation': 'outdoor',
                'timeOfDay': 'afternoon',
                'plannedDuration': 2.5
            }
        ]
        
        event_id = client.create_workout_event(test_date, workouts)
        assert event_id is not None
        
        print(f"\nCreated multi-workout test event with ID: {event_id}")
    
    def test_export_workout_plan(self, client):
        """Test exporting a complete workout plan"""
        # Create a small test plan for the next week
        today = date.today()
        
        workouts_by_date = {
            today + timedelta(days=32): [
                {'workoutType': 'Integration Test Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
            ],
            today + timedelta(days=33): [
                {'workoutType': 'Integration Test Swim', 'timeOfDay': 'morning', 'plannedDuration': 1.5},
                {'workoutType': 'Integration Test Bike', 'timeOfDay': 'afternoon', 'plannedDuration': 2.0}
            ],
            today + timedelta(days=34): [
                {'workoutType': 'Integration Test Strength', 'timeOfDay': 'evening', 'plannedDuration': 0.75}
            ]
        }
        
        # Export plan
        created_count = client.export_workout_plan(workouts_by_date)
        assert created_count == 3
        
        print(f"\nExported {created_count} workout events to test calendar")
    
    def test_event_format_validation(self, client):
        """Test that created events have the correct format"""
        test_date = date.today() + timedelta(days=35)
        
        workouts = [
            {
                'workoutType': 'Run',
                'workoutLocation': 'outdoor',
                'timeOfDay': 'morning',
                'plannedDuration': 1.5
            }
        ]
        
        # Create event
        event_id = client.create_workout_event(test_date, workouts)
        
        # Retrieve the event to verify format
        events = client._calendar.events()
        
        # Find our test event
        found = False
        for event in events:
            if "SUMMARY:Joe workout schedule" in event.data:
                found = True
                # Verify the event data contains expected information
                assert "Type: Run" in event.data
                assert "Location: outdoor" in event.data
                assert "Time: morning" in event.data
                assert "Duration:" in event.data
                print(f"\nVerified event format is correct")
                break
        
        assert found, "Could not find created workout event"
    
    def test_delete_only_workout_events(self, client):
        """Test that delete_all_workout_events only deletes workout schedule events"""
        test_date = date.today() + timedelta(days=36)
        
        workouts = [
            {'workoutType': 'Test Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
        ]
        
        # Create event
        client.create_workout_event(test_date, workouts)
        
        # Delete workout events (should delete at least our test event)
        deleted_count = client.delete_all_workout_events()
        assert deleted_count >= 1
        
        print(f"\nSuccessfully deleted {deleted_count} workout event(s)")
        
        # Try deleting again - should delete 0 events
        deleted_count_2 = client.delete_all_workout_events()
        assert deleted_count_2 == 0, "Should not find any workout events after deletion"
    
    def test_delete_workout_events_in_range(self, client):
        """Test that delete_workout_events_in_range only deletes events within the specified date range"""
        today = date.today()
        
        # Create events across 3 different weeks
        week1_date1 = today + timedelta(days=37)
        week1_date2 = today + timedelta(days=38)
        week2_date1 = today + timedelta(days=44)  # 7 days later
        week2_date2 = today + timedelta(days=45)
        week3_date1 = today + timedelta(days=51)  # 7 days later
        
        workouts = [
            {'workoutType': 'Test Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
        ]
        
        # Create events in all 3 weeks
        client.create_workout_event(week1_date1, workouts)
        client.create_workout_event(week1_date2, workouts)
        client.create_workout_event(week2_date1, workouts)
        client.create_workout_event(week2_date2, workouts)
        client.create_workout_event(week3_date1, workouts)
        
        print(f"\nCreated 5 workout events across 3 different weeks")
        
        # Delete only week 2 events (should delete 2 events)
        deleted_count = client.delete_workout_events_in_range(
            today + timedelta(days=42),  # Start of week 2 range
            today + timedelta(days=48)   # End of week 2 range
        )
        
        assert deleted_count == 2, f"Expected to delete 2 events in week 2, but deleted {deleted_count}"
        print(f"Deleted {deleted_count} events in week 2 date range")
        
        # Verify week 1 and week 3 events still exist
        remaining_count = client.delete_all_workout_events()
        assert remaining_count == 3, f"Expected 3 remaining events (week 1 and week 3), but found {remaining_count}"
        print(f"Verified {remaining_count} events remain outside the deleted range")
    
    def test_delete_workout_events_in_range_preserves_non_workout_events(self, client):
        """Test that delete_workout_events_in_range doesn't delete non-workout events"""
        today = date.today()
        test_date = today + timedelta(days=52)
        
        # Create a workout event
        workouts = [
            {'workoutType': 'Test Run', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
        ]
        client.create_workout_event(test_date, workouts)
        
        # Create a non-workout event manually
        non_workout_ical = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Workout Planner Integration Test//EN
BEGIN:VEVENT
UID:test-non-workout-{test_date.isoformat()}@workoutplanner.test
DTSTART;VALUE=DATE:{test_date.strftime('%Y%m%d')}
DTEND;VALUE=DATE:{(test_date + timedelta(days=1)).strftime('%Y%m%d')}
SUMMARY:Doctor Appointment
DESCRIPTION:Annual checkup
END:VEVENT
END:VCALENDAR"""
        
        client._calendar.save_event(non_workout_ical)
        print(f"\nCreated 1 workout event and 1 non-workout event on {test_date}")
        
        # Delete workout events in range
        deleted_count = client.delete_workout_events_in_range(
            test_date - timedelta(days=1),
            test_date + timedelta(days=1)
        )
        
        assert deleted_count == 1, f"Expected to delete only 1 workout event, but deleted {deleted_count}"
        print(f"Deleted {deleted_count} workout event")
        
        # Verify non-workout event still exists
        all_events = list(client._calendar.events())
        non_workout_events = [e for e in all_events if "Doctor Appointment" in e.data]
        
        assert len(non_workout_events) == 1, "Non-workout event should still exist"
        print(f"Verified non-workout event was preserved")
        
        # Clean up the non-workout event manually
        non_workout_events[0].delete()
    
    def test_re_export_same_date_range(self, client):
        """Test that re-exporting the same date range replaces old events with new ones"""
        today = date.today()
        start_date = today + timedelta(days=53)
        end_date = today + timedelta(days=56)
        
        # First export: Create workouts for 3 days
        workouts_v1 = {
            start_date: [
                {'workoutType': 'Run V1', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
            ],
            start_date + timedelta(days=1): [
                {'workoutType': 'Swim V1', 'timeOfDay': 'morning', 'plannedDuration': 1.5}
            ],
            start_date + timedelta(days=2): [
                {'workoutType': 'Bike V1', 'timeOfDay': 'afternoon', 'plannedDuration': 2.0}
            ]
        }
        
        created_count_v1 = client.export_workout_plan(workouts_v1)
        assert created_count_v1 == 3
        print(f"\nFirst export: Created {created_count_v1} events")
        
        # Delete events in range and re-export with different workouts
        deleted_count = client.delete_workout_events_in_range(start_date, end_date)
        assert deleted_count == 3
        print(f"Deleted {deleted_count} events before re-export")
        
        # Second export: Different workouts for the same dates
        workouts_v2 = {
            start_date: [
                {'workoutType': 'Strength V2', 'timeOfDay': 'evening', 'plannedDuration': 0.75}
            ],
            start_date + timedelta(days=1): [
                {'workoutType': 'Yoga V2', 'timeOfDay': 'morning', 'plannedDuration': 1.0}
            ],
            start_date + timedelta(days=2): [
                {'workoutType': 'Rest Day V2', 'timeOfDay': 'Not specified', 'plannedDuration': None}
            ]
        }
        
        created_count_v2 = client.export_workout_plan(workouts_v2)
        assert created_count_v2 == 3
        print(f"Second export: Created {created_count_v2} new events")
        
        # Verify only V2 events exist
        events = list(client._calendar.events())
        workout_events = [e for e in events if "SUMMARY:Joe workout schedule" in e.data]
        
        # Should have exactly 3 events (the V2 ones)
        assert len(workout_events) == 3
        
        # Verify they're V2 events by checking for V2 workout types
        all_event_data = "".join([e.data for e in workout_events])
        assert "Strength V2" in all_event_data
        assert "Yoga V2" in all_event_data
        
        # Verify V1 workouts are gone
        assert "Run V1" not in all_event_data
        assert "Swim V1" not in all_event_data
        
        print(f"Verified that re-export replaced old events with new ones")
