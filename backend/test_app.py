"""
Tests for workout planner backend
"""
import pytest
import json
from datetime import date, datetime
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