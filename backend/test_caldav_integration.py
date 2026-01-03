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
