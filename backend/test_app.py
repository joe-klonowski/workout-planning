"""
Tests for workout planner backend
"""
import pytest
import json
from datetime import date, datetime
from unittest.mock import patch, MagicMock
from app import create_app
from models import db, Workout, WorkoutSelection, CustomWorkout
import io


@pytest.fixture
def app():
    """Create and configure a test app instance"""
    # Use the testing config which has in-memory database
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for making requests"""
    return app.test_client()


@pytest.fixture
def sample_workout(app):
    """Create a sample workout for testing"""
    with app.app_context():
        workout = Workout(
            title="Test Swim Workout",
            workout_type="Swim",
            workout_description="Test description",
            planned_duration=1.0,
            planned_distance_meters=2000.0,
            originally_planned_day=date(2026, 1, 15),
            coach_comments="Test comments"
        )
        db.session.add(workout)
        db.session.commit()
        return workout.id


@pytest.fixture
def sample_csv_data():
    """Sample CSV data for import testing"""
    return """Title,WorkoutType,WorkoutDescription,PlannedDuration,PlannedDistanceInMeters,WorkoutDay,CoachComments,TSS,IF
"Morning Swim","Swim","Easy 2000m swim",1.0,2000.0,2026-01-10,"Focus on form",50.0,0.65
"Long Run","Run","60 minute run",1.0,10000.0,2026-01-11,"Zone 2 effort",45.0,0.70"""


# ============= MODEL TESTS =============

def test_workout_model(app):
    """Test Workout model creation and to_dict"""
    with app.app_context():
        workout = Workout(
            title="Test Workout",
            workout_type="Run",
            workout_description="Test description",
            planned_duration=1.5,
            planned_distance_meters=10000.0,
            originally_planned_day=date(2026, 1, 15),
            coach_comments="Test comments",
            tss=60.0,
            intensity_factor=0.75
        )
        db.session.add(workout)
        db.session.commit()
        
        assert workout.id is not None
        assert workout.title == "Test Workout"
        assert workout.workout_type == "Run"
        
        workout_dict = workout.to_dict()
        assert workout_dict['title'] == "Test Workout"
        assert workout_dict['workoutType'] == "Run"
        assert workout_dict['plannedDuration'] == 1.5


def test_workout_selection_model(app, sample_workout):
    """Test WorkoutSelection model"""
    with app.app_context():
        selection = WorkoutSelection(
            workout_id=sample_workout,
            is_selected=True,
            current_plan_day=date(2026, 1, 20),
            time_of_day="morning",
            user_notes="Moved to Saturday"
        )
        db.session.add(selection)
        db.session.commit()
        
        assert selection.id is not None
        assert selection.is_selected is True
        assert selection.time_of_day == "morning"
        
        selection_dict = selection.to_dict()
        assert selection_dict['isSelected'] is True
        assert selection_dict['timeOfDay'] == "morning"


def test_custom_workout_model(app):
    """Test CustomWorkout model"""
    with app.app_context():
        custom = CustomWorkout(
            title="Group Ride",
            workout_type="Bike",
            description="Weekly group ride",
            planned_date=date(2026, 1, 18),
            planned_duration=2.0,
            time_of_day="Saturday 8am"
        )
        db.session.add(custom)
        db.session.commit()
        
        assert custom.id is not None
        assert custom.title == "Group Ride"
        
        custom_dict = custom.to_dict()
        assert custom_dict['isCustom'] is True
        assert custom_dict['workoutType'] == "Bike"


# ============= API ENDPOINT TESTS =============

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'timestamp' in data


def test_get_workouts_empty(client):
    """Test getting workouts when database is empty"""
    response = client.get('/api/workouts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['count'] == 0
    assert data['workouts'] == []


def test_get_workouts(client, sample_workout):
    """Test getting all workouts"""
    response = client.get('/api/workouts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['count'] == 1
    assert len(data['workouts']) == 1
    assert data['workouts'][0]['title'] == "Test Swim Workout"


def test_get_workout_by_id(client, sample_workout):
    """Test getting a specific workout"""
    response = client.get(f'/api/workouts/{sample_workout}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == "Test Swim Workout"
    assert data['workoutType'] == "Swim"


def test_get_workout_not_found(client):
    """Test getting non-existent workout"""
    response = client.get('/api/workouts/999')
    assert response.status_code == 404


def test_import_workouts_csv(client, sample_csv_data):
    """Test importing workouts from CSV"""
    response = client.post(
        '/api/workouts/import',
        data=sample_csv_data,
        content_type='text/csv'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['imported'] == 2
    assert 'Successfully imported' in data['message']
    
    # Verify workouts were imported
    response = client.get('/api/workouts')
    data = json.loads(response.data)
    assert data['count'] == 2


def test_import_workouts_file_upload(client, sample_csv_data):
    """Test importing workouts via file upload"""
    data = {
        'file': (io.BytesIO(sample_csv_data.encode('utf-8')), 'workouts.csv')
    }
    response = client.post(
        '/api/workouts/import',
        data=data,
        content_type='multipart/form-data'
    )
    assert response.status_code == 201
    result = json.loads(response.data)
    assert result['imported'] == 2


def test_import_workouts_no_duplicates(client, sample_csv_data):
    """Test that importing the same CSV twice doesn't create duplicates"""
    # Import once
    client.post('/api/workouts/import', data=sample_csv_data, content_type='text/csv')
    
    # Import again
    response = client.post('/api/workouts/import', data=sample_csv_data, content_type='text/csv')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['imported'] == 0  # No new workouts imported
    
    # Verify still only 2 workouts
    response = client.get('/api/workouts')
    data = json.loads(response.data)
    assert data['count'] == 2


def test_update_selection(client, sample_workout):
    """Test creating/updating a workout selection"""
    selection_data = {
        'isSelected': True,
        'currentPlanDay': '2026-01-20',
        'timeOfDay': 'morning',
        'userNotes': 'Moved to Saturday'
    }
    
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is True
    assert data['timeOfDay'] == 'morning'
    assert data['currentPlanDay'] == '2026-01-20'


def test_update_selection_partial(client, sample_workout):
    """Test updating only some fields of a selection"""
    selection_data = {
        'isSelected': False
    }
    
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is False


def test_deselecting_workout_clears_time_of_day(client, sample_workout):
    """Test that deselecting a workout clears the time of day"""
    # First, set the workout as selected with a time of day
    selection_data = {
        'isSelected': True,
        'timeOfDay': 'morning'
    }
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is True
    assert data['timeOfDay'] == 'morning'
    
    # Now deselect the workout
    selection_data = {
        'isSelected': False
    }
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is False
    assert data['timeOfDay'] is None  # Time of day should be cleared


def test_delete_selection(client, sample_workout):
    """Test deleting a workout selection"""
    # First create a selection
    selection_data = {'isSelected': False}
    client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    
    # Then delete it
    response = client.delete(f'/api/selections/{sample_workout}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Selection deleted'


def test_update_selection_with_workout_location(client, sample_workout):
    """Test updating a workout selection with workout location"""
    selection_data = {
        'isSelected': True,
        'workoutLocation': 'indoor'
    }
    
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is True
    assert data['workoutLocation'] == 'indoor'


def test_update_selection_location_to_outdoor(client, sample_workout):
    """Test changing workout location from indoor to outdoor"""
    # First set as indoor
    selection_data = {'workoutLocation': 'indoor'}
    client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    
    # Then change to outdoor
    selection_data = {'workoutLocation': 'outdoor'}
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['workoutLocation'] == 'outdoor'


def test_update_selection_clear_location(client, sample_workout):
    """Test clearing workout location by setting it to null"""
    # First set a location
    selection_data = {'workoutLocation': 'indoor'}
    client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    
    # Then clear it by setting to null
    selection_data = {'workoutLocation': None}
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['workoutLocation'] is None


def test_workout_selection_model_with_location(app, sample_workout):
    """Test WorkoutSelection model with workout_location field"""
    with app.app_context():
        selection = WorkoutSelection(
            workout_id=sample_workout,
            is_selected=True,
            workout_location='indoor'
        )
        db.session.add(selection)
        db.session.commit()
        
        assert selection.workout_location == 'indoor'
        
        # Test to_dict includes workoutLocation
        selection_dict = selection.to_dict()
        assert selection_dict['workoutLocation'] == 'indoor'



def test_get_custom_workouts_empty(client):
    """Test getting custom workouts when none exist"""
    response = client.get('/api/custom-workouts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['count'] == 0
    assert data['customWorkouts'] == []


def test_create_custom_workout(client):
    """Test creating a custom workout"""
    workout_data = {
        'title': 'Group Ride',
        'workoutType': 'Bike',
        'description': 'Weekly group ride',
        'plannedDate': '2026-01-18',
        'plannedDuration': 2.0,
        'timeOfDay': 'Saturday 8am'
    }
    
    response = client.post(
        '/api/custom-workouts',
        data=json.dumps(workout_data),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == 'Group Ride'
    assert data['workoutType'] == 'Bike'
    assert data['isCustom'] is True


def test_create_custom_workout_with_location(client):
    """Test creating a custom workout with workout location"""
    workout_data = {
        'title': 'Indoor Bike Ride',
        'workoutType': 'Bike',
        'description': 'Zwift workout',
        'plannedDate': '2026-01-18',
        'plannedDuration': 1.5,
        'workoutLocation': 'indoor'
    }
    
    response = client.post(
        '/api/custom-workouts',
        data=json.dumps(workout_data),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == 'Indoor Bike Ride'
    assert data['workoutLocation'] == 'indoor'


def test_custom_workout_model_with_location(app):
    """Test CustomWorkout model with workout_location field"""
    with app.app_context():
        workout = CustomWorkout(
            title="Outdoor Ride",
            workout_type="Bike",
            description="Group ride",
            planned_date=date(2026, 1, 18),
            workout_location='outdoor'
        )
        db.session.add(workout)
        db.session.commit()
        
        assert workout.workout_location == 'outdoor'
        
        # Test to_dict includes workoutLocation
        workout_dict = workout.to_dict()
        assert workout_dict['workoutLocation'] == 'outdoor'



def test_update_custom_workout(client, app):
    """Test updating a custom workout"""
    # Create a custom workout first
    with app.app_context():
        custom = CustomWorkout(
            title="Original Title",
            workout_type="Run",
            description="Original description",
            planned_date=date(2026, 1, 15)
        )
        db.session.add(custom)
        db.session.commit()
        workout_id = custom.id
    
    # Update it
    update_data = {
        'title': 'Updated Title',
        'plannedDuration': 1.5
    }
    
    response = client.put(
        f'/api/custom-workouts/{workout_id}',
        data=json.dumps(update_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Updated Title'
    assert data['plannedDuration'] == 1.5


def test_update_custom_workout_with_location(client, app):
    """Test updating a custom workout's location"""
    # Create a custom workout first
    with app.app_context():
        custom = CustomWorkout(
            title="Bike Ride",
            workout_type="Bike",
            description="Test ride",
            planned_date=date(2026, 1, 15)
        )
        db.session.add(custom)
        db.session.commit()
        workout_id = custom.id
    
    # Update location to indoor
    update_data = {'workoutLocation': 'indoor'}
    
    response = client.put(
        f'/api/custom-workouts/{workout_id}',
        data=json.dumps(update_data),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['workoutLocation'] == 'indoor'



def test_delete_custom_workout(client, app):
    """Test deleting a custom workout"""
    # Create a custom workout first
    with app.app_context():
        custom = CustomWorkout(
            title="To Delete",
            workout_type="Run",
            planned_date=date(2026, 1, 15)
        )
        db.session.add(custom)
        db.session.commit()
        workout_id = custom.id
    
    # Delete it
    response = client.delete(f'/api/custom-workouts/{workout_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Custom workout deleted'
    
    # Verify it's gone
    response = client.get('/api/custom-workouts')
    data = json.loads(response.data)
    assert data['count'] == 0


def test_get_stats(client, sample_workout, app):
    """Test getting workout statistics"""
    # Add a selection and custom workout
    with app.app_context():
        selection = WorkoutSelection(workout_id=sample_workout, is_selected=True)
        custom = CustomWorkout(
            title="Custom",
            workout_type="Run",
            planned_date=date(2026, 1, 15)
        )
        db.session.add(selection)
        db.session.add(custom)
        db.session.commit()
    
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['totalWorkouts'] == 1
    assert data['selectedWorkouts'] == 1
    assert data['customWorkouts'] == 1


def test_workout_with_selection_relationship(client, sample_workout):
    """Test that workout includes selection in to_dict"""
    # Create a selection
    selection_data = {'isSelected': True, 'timeOfDay': 'morning'}
    client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps(selection_data),
        content_type='application/json'
    )
    
    # Get the workout
    response = client.get(f'/api/workouts/{sample_workout}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['selection'] is not None
    assert data['selection']['isSelected'] is True
    assert data['selection']['timeOfDay'] == 'morning'


def test_toggle_workout_selection(client, sample_workout):
    """Test toggling workout selection from planned to not planned"""
    # Initially select the workout (add to plan)
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps({'isSelected': True}),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is True
    
    # Remove from plan
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps({'isSelected': False}),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is False
    
    # Verify the workout still includes the selection
    response = client.get(f'/api/workouts/{sample_workout}')
    assert response.status_code == 200
    workout_data = json.loads(response.data)
    assert workout_data['selection']['isSelected'] is False
    
    # Add back to plan
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps({'isSelected': True}),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['isSelected'] is True

def test_workout_date_change_preserves_original(client, sample_workout):
    """Test that moving a workout preserves the original workout day"""
    # First get the workout to verify original date
    response = client.get(f'/api/workouts/{sample_workout}')
    assert response.status_code == 200
    workout = json.loads(response.data)
    original_date = workout['originallyPlannedDay']
    assert original_date == '2026-01-15'
    
    # Move the workout to a different date
    new_date = '2026-01-20'
    response = client.put(
        f'/api/selections/{sample_workout}',
        data=json.dumps({'currentPlanDay': new_date}),
        content_type='application/json'
    )
    assert response.status_code == 200
    selection = json.loads(response.data)
    assert selection['currentPlanDay'] == new_date
    
    # Verify the original workout day is unchanged
    response = client.get(f'/api/workouts/{sample_workout}')
    assert response.status_code == 200
    workout = json.loads(response.data)
    assert workout['originallyPlannedDay'] == original_date  # Original date unchanged
    assert workout['selection']['currentPlanDay'] == new_date  # New date stored in selection
    
    # Verify workout list shows the selection
    response = client.get('/api/workouts')
    assert response.status_code == 200
    data = json.loads(response.data)
    workouts = data['workouts']
    moved_workout = next(w for w in workouts if w['id'] == sample_workout)
    assert moved_workout['originallyPlannedDay'] == original_date
    assert moved_workout['selection']['currentPlanDay'] == new_date


# ============= CALDAV EXPORT TESTS =============

@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_success(mock_get_credentials, mock_caldav_client, client, app):
    """Test successful export to calendar"""
    # Setup mock credentials
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Test Calendar'
    }
    
    # Setup mock CalDAV client
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 3
    mock_caldav_client.return_value = mock_client_instance
    
    # Create some test workouts
    with app.app_context():
        workout1 = Workout(
            title="Morning Swim",
            workout_type="Swim",
            workout_description="Easy swim",
            planned_duration=1.0,
            planned_distance_meters=2000.0,
            originally_planned_day=date(2026, 1, 10)
        )
        workout2 = Workout(
            title="Long Run",
            workout_type="Run",
            workout_description="Base run",
            planned_duration=1.5,
            planned_distance_meters=15000.0,
            originally_planned_day=date(2026, 1, 11)
        )
        db.session.add_all([workout1, workout2])
        db.session.commit()
        
        # Add selection with time of day
        selection1 = WorkoutSelection(
            workout_id=workout1.id,
            is_selected=True,
            time_of_day="morning",
            workout_location="indoor"
        )
        selection2 = WorkoutSelection(
            workout_id=workout2.id,
            is_selected=True,
            time_of_day="evening"
        )
        db.session.add_all([selection1, selection2])
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar', 
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'eventsCreated' in data
    assert data['eventsCreated'] == 3
    assert data['dateRange']['start'] == '2026-01-08'
    assert data['dateRange']['end'] == '2026-01-14'
    
    # Verify CalDAV client was called correctly
    mock_caldav_client.assert_called_once_with(
        url='https://caldav.test.com/',
        username='test@example.com',
        password='test-password'
    )
    mock_client_instance.connect.assert_called_once()
    mock_client_instance.select_calendar.assert_called_once_with('Test Calendar')
    mock_client_instance.export_workout_plan.assert_called_once()
    mock_client_instance.disconnect.assert_called_once()


@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_missing_credentials(mock_get_credentials, client):
    """Test export fails with missing credentials"""
    mock_get_credentials.return_value = {
        'url': None,
        'username': None,
        'password': None,
        'calendar_name': None
    }
    
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert 'credentials not configured' in data['error'].lower()


def test_export_to_calendar_missing_dates(client):
    """Test export fails with missing date parameters"""
    # Missing endDate
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    
    # Missing startDate
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data


def test_export_to_calendar_invalid_date_range(client):
    """Test export fails when start date is after end date"""
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-20',
                              'endDate': '2026-01-10'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'before or equal' in data['error'].lower()


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_only_selected_workouts(mock_get_credentials, mock_caldav_client, client, app):
    """Test that only selected workouts are exported"""
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Test Calendar'
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 1
    mock_caldav_client.return_value = mock_client_instance
    
    # Create test workouts - one selected, one not
    with app.app_context():
        workout1 = Workout(
            title="Selected Workout",
            workout_type="Swim",
            workout_description="This should be exported",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        workout2 = Workout(
            title="Unselected Workout",
            workout_type="Run",
            workout_description="This should NOT be exported",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 11)
        )
        db.session.add_all([workout1, workout2])
        db.session.commit()
        
        # Mark first as selected, second as not selected
        selection1 = WorkoutSelection(
            workout_id=workout1.id,
            is_selected=True
        )
        selection2 = WorkoutSelection(
            workout_id=workout2.id,
            is_selected=False
        )
        db.session.add_all([selection1, selection2])
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify only one workout was exported (the selected one)
    call_args = mock_client_instance.export_workout_plan.call_args[0][0]
    assert len(call_args) == 1  # Only one date with workouts
    assert date(2026, 1, 10) in call_args


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_with_moved_workout(mock_get_credentials, mock_caldav_client, client, app):
    """Test that workouts that have been moved to new dates are exported correctly"""
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Test Calendar'
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 1
    mock_caldav_client.return_value = mock_client_instance
    
    # Create a workout and move it to a different date
    with app.app_context():
        workout = Workout(
            title="Moved Workout",
            workout_type="Bike",
            workout_description="This was moved",
            planned_duration=2.0,
            originally_planned_day=date(2026, 1, 10)  # Original date
        )
        db.session.add(workout)
        db.session.commit()
        
        # Move workout to a different date
        selection = WorkoutSelection(
            workout_id=workout.id,
            is_selected=True,
            current_plan_day=date(2026, 1, 12)  # Moved to this date
        )
        db.session.add(selection)
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify workout was exported on the new date (not original date)
    call_args = mock_client_instance.export_workout_plan.call_args[0][0]
    assert date(2026, 1, 12) in call_args  # New date
    assert date(2026, 1, 10) not in call_args  # Original date should not be there


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_multiple_workouts_same_day(mock_get_credentials, mock_caldav_client, client, app):
    """Test that multiple workouts on the same day are all included in the export"""
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Test Calendar'
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 1
    mock_caldav_client.return_value = mock_client_instance
    
    # Create multiple workouts on the same day
    with app.app_context():
        workout1 = Workout(
            title="Morning Swim",
            workout_type="Swim",
            workout_description="Easy swim",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        workout2 = Workout(
            title="Afternoon Run",
            workout_type="Run",
            workout_description="Base run",
            planned_duration=0.5,
            originally_planned_day=date(2026, 1, 10)  # Same day
        )
        workout3 = Workout(
            title="Evening Strength",
            workout_type="Strength",
            workout_description="Core work",
            planned_duration=0.75,
            originally_planned_day=date(2026, 1, 10)  # Same day
        )
        db.session.add_all([workout1, workout2, workout3])
        db.session.commit()
        
        # Mark all as selected with different times of day
        selection1 = WorkoutSelection(
            workout_id=workout1.id,
            is_selected=True,
            time_of_day="morning",
            workout_location="indoor"
        )
        selection2 = WorkoutSelection(
            workout_id=workout2.id,
            is_selected=True,
            time_of_day="afternoon",
            workout_location="outdoor"
        )
        selection3 = WorkoutSelection(
            workout_id=workout3.id,
            is_selected=True,
            time_of_day="evening"
        )
        db.session.add_all([selection1, selection2, selection3])
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify that export_workout_plan was called with all three workouts grouped by the same date
    call_args = mock_client_instance.export_workout_plan.call_args[0][0]
    assert date(2026, 1, 10) in call_args
    
    # The key part: verify that all 3 workouts are in the list for that date
    workouts_for_jan_10 = call_args[date(2026, 1, 10)]
    assert len(workouts_for_jan_10) == 3, f"Expected 3 workouts for Jan 10, but got {len(workouts_for_jan_10)}"
    
    # Verify all workout types are present
    workout_types = [w['workoutType'] for w in workouts_for_jan_10]
    assert 'Swim' in workout_types
    assert 'Run' in workout_types
    assert 'Strength' in workout_types
    
    # Verify all times of day are present
    times_of_day = [w['timeOfDay'] for w in workouts_for_jan_10]
    assert 'morning' in times_of_day
    assert 'afternoon' in times_of_day
    assert 'evening' in times_of_day


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_uses_specific_calendar_name(mock_get_credentials, mock_caldav_client, client, app):
    """Test that export uses the specific calendar name from credentials"""
    # Setup credentials with a specific calendar name
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'My Workout Calendar'  # Specific calendar name
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 1
    mock_caldav_client.return_value = mock_client_instance
    
    # Create a test workout
    with app.app_context():
        workout = Workout(
            title="Test Workout",
            workout_type="Run",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        db.session.add(workout)
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify that select_calendar was called with the specific calendar name
    mock_client_instance.select_calendar.assert_called_once_with('My Workout Calendar')


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_with_null_calendar_name(mock_get_credentials, mock_caldav_client, client, app):
    """Test that export fails when no specific calendar name is provided"""
    # Setup credentials without a specific calendar name
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': None  # No specific calendar - should error
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.export_workout_plan.return_value = 1
    mock_caldav_client.return_value = mock_client_instance
    
    # Create a test workout
    with app.app_context():
        workout = Workout(
            title="Test Workout",
            workout_type="Run",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        db.session.add(workout)
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    # Should fail with 500 error
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert 'calendar name not configured' in data['error'].lower()
    
    # Verify that CalDAV client methods were NOT called
    mock_client_instance.connect.assert_not_called()
    mock_client_instance.select_calendar.assert_not_called()
    mock_client_instance.export_workout_plan.assert_not_called()


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_deletes_existing_events_in_date_range(mock_get_credentials, mock_caldav_client, client, app):
    """Test that export deletes existing workout events in the date range before creating new ones"""
    # Setup credentials
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Workouts'
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.delete_workout_events_in_range.return_value = 3  # Simulate deleting 3 existing events
    mock_client_instance.export_workout_plan.return_value = 2
    mock_caldav_client.return_value = mock_client_instance
    
    # Create test workouts
    with app.app_context():
        workout1 = Workout(
            title="Test Workout 1",
            workout_type="Run",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        workout2 = Workout(
            title="Test Workout 2",
            workout_type="Swim",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 11)
        )
        db.session.add_all([workout1, workout2])
        db.session.commit()
    
    # Make export request
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify the call sequence
    mock_client_instance.connect.assert_called_once()
    mock_client_instance.select_calendar.assert_called_once_with('Workouts')
    
    # THE KEY ASSERTION: delete_workout_events_in_range should be called with the date range
    mock_client_instance.delete_workout_events_in_range.assert_called_once_with(
        date(2026, 1, 8),
        date(2026, 1, 14)
    )
    mock_client_instance.export_workout_plan.assert_called_once()
    
    # Verify delete was called before export by checking call order
    call_order = [call[0] for call in mock_client_instance.method_calls]
    delete_index = call_order.index('delete_workout_events_in_range')
    export_index = call_order.index('export_workout_plan')
    assert delete_index < export_index, "delete_workout_events_in_range should be called before export_workout_plan"


@patch('app.CalDAVClient')
@patch('app.Config.get_caldav_credentials')
def test_export_to_calendar_only_deletes_events_in_date_range(mock_get_credentials, mock_caldav_client, client, app):
    """Test that export only deletes workout events within the specified date range, not all events"""
    # Setup credentials
    mock_get_credentials.return_value = {
        'url': 'https://caldav.test.com/',
        'username': 'test@example.com',
        'password': 'test-password',
        'calendar_name': 'Workouts'
    }
    
    mock_client_instance = MagicMock()
    mock_client_instance.delete_workout_events_in_range.return_value = 2  # Only 2 events in the range
    mock_client_instance.export_workout_plan.return_value = 2
    mock_caldav_client.return_value = mock_client_instance
    
    # Create test workouts
    with app.app_context():
        workout1 = Workout(
            title="Test Workout 1",
            workout_type="Run",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 10)
        )
        workout2 = Workout(
            title="Test Workout 2",
            workout_type="Swim",
            workout_description="Test",
            planned_duration=1.0,
            originally_planned_day=date(2026, 1, 11)
        )
        db.session.add_all([workout1, workout2])
        db.session.commit()
    
    # Make export request for a specific date range (Jan 8-14)
    response = client.post('/api/export/calendar',
                          data=json.dumps({
                              'startDate': '2026-01-08',
                              'endDate': '2026-01-14'
                          }),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # THE KEY ASSERTION: Should call delete_workout_events_in_range with the specific date range
    # NOT delete_all_workout_events (which would delete everything)
    mock_client_instance.delete_workout_events_in_range.assert_called_once_with(
        date(2026, 1, 8),
        date(2026, 1, 14)
    )
    
    # Should NOT call delete_all_workout_events
    mock_client_instance.delete_all_workout_events.assert_not_called()
    
    # Verify delete was called before export
    call_order = [call[0] for call in mock_client_instance.method_calls]
    delete_index = call_order.index('delete_workout_events_in_range')
    export_index = call_order.index('export_workout_plan')
    assert delete_index < export_index, "delete_workout_events_in_range should be called before export_workout_plan"


# ============= TRI CLUB SCHEDULE TESTS =============

def test_get_tri_club_schedule(client):
    """Test getting tri club schedule"""
    response = client.get('/api/tri-club-schedule')
    assert response.status_code == 200
    
    data = response.get_json()
    assert 'schedule' in data
    assert 'effective_date' in data
    assert isinstance(data['schedule'], dict)
    
    # Verify structure of schedule
    for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
        if day in data['schedule']:
            assert isinstance(data['schedule'][day], list)
            for event in data['schedule'][day]:
                assert 'time' in event
                assert 'activity' in event


def test_get_tri_club_schedule_has_expected_days(client):
    """Test that tri club schedule includes expected days"""
    response = client.get('/api/tri-club-schedule')
    assert response.status_code == 200
    
    data = response.get_json()
    schedule = data['schedule']
    
    # Verify at least some common days are present
    assert 'monday' in schedule
    assert 'saturday' in schedule


# ============= WEEKLY TARGETS TESTS =============

def test_get_weekly_targets(client):
    """Test getting weekly targets"""
    response = client.get('/api/weekly-targets')
    assert response.status_code == 200
    
    data = response.get_json()
    assert 'weekly_targets' in data
    assert 'week_start_date' in data
    
    targets = data['weekly_targets']
    assert 'tss' in targets
    assert 'total_time' in targets
    assert 'by_discipline' in targets
    
    # Verify structure of total_time
    total_time = targets['total_time']
    assert 'hours' in total_time
    assert 'minutes' in total_time
    assert isinstance(total_time['hours'], (int, float))
    assert isinstance(total_time['minutes'], (int, float))
    
    # Verify structure of by_discipline
    by_discipline = targets['by_discipline']
    assert isinstance(by_discipline, dict)
    for discipline, time_data in by_discipline.items():
        assert 'hours' in time_data
        assert 'minutes' in time_data
        assert isinstance(time_data['hours'], (int, float))
        assert isinstance(time_data['minutes'], (int, float))


def test_weekly_targets_has_expected_disciplines(client):
    """Test that weekly targets includes expected disciplines"""
    response = client.get('/api/weekly-targets')
    assert response.status_code == 200
    
    data = response.get_json()
    by_discipline = data['weekly_targets']['by_discipline']
    
    # Verify expected disciplines are present
    expected_disciplines = ['swim', 'bike', 'run', 'strength']
    for discipline in expected_disciplines:
        assert discipline in by_discipline, f"Expected discipline '{discipline}' not found in targets"


def test_weekly_targets_tss_is_number(client):
    """Test that TSS target is a number"""
    response = client.get('/api/weekly-targets')
    assert response.status_code == 200
    
    data = response.get_json()
    tss = data['weekly_targets']['tss']
    assert isinstance(tss, (int, float))
    assert tss > 0
