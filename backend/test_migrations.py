"""
Tests for Alembic database migrations
"""
import pytest
import os
import tempfile
import subprocess
from sqlalchemy import create_engine, inspect
from app import create_app
from models import db


@pytest.fixture
def temp_db():
    """Create a temporary database for testing migrations"""
    # Create a temporary directory and database file
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'test_migrations.db')
    db_uri = f'sqlite:///{db_path}'
    
    yield db_path, db_uri
    
    # Cleanup
    if os.path.exists(db_path):
        os.remove(db_path)
    os.rmdir(temp_dir)


def test_alembic_migrations_create_tables(temp_db):
    """Test that running alembic upgrade creates all expected tables"""
    db_path, db_uri = temp_db
    
    # Set environment variable to use test database
    original_db_uri = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = db_uri
    os.environ['ALEMBIC_RUNNING'] = 'true'
    
    try:
        # Run alembic upgrade
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True
        )
        
        # Check that command succeeded
        assert result.returncode == 0, f"Alembic upgrade failed: {result.stderr}"
        
        # Verify tables were created
        engine = create_engine(db_uri)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Expected tables
        assert 'workouts' in tables
        assert 'workout_selections' in tables
        assert 'custom_workouts' in tables
        assert 'alembic_version' in tables
        
        # Verify workouts table schema
        workouts_columns = {col['name'] for col in inspector.get_columns('workouts')}
        expected_workouts_columns = {
            'id', 'title', 'workout_type', 'workout_description',
            'planned_duration', 'planned_distance_meters', 'workout_day',
            'coach_comments', 'tss', 'intensity_factor', 'created_at'
        }
        assert expected_workouts_columns.issubset(workouts_columns)
        
        # Verify workout_selections table schema
        selections_columns = {col['name'] for col in inspector.get_columns('workout_selections')}
        expected_selections_columns = {
            'id', 'workout_id', 'is_selected', 'actual_date',
            'time_of_day', 'user_notes', 'updated_at'
        }
        assert expected_selections_columns.issubset(selections_columns)
        
        # Verify custom_workouts table schema
        custom_columns = {col['name'] for col in inspector.get_columns('custom_workouts')}
        expected_custom_columns = {
            'id', 'title', 'workout_type', 'description',
            'planned_date', 'planned_duration', 'time_of_day',
            'created_at', 'updated_at'
        }
        assert expected_custom_columns.issubset(custom_columns)
        
        engine.dispose()
        
    finally:
        # Restore original environment
        if original_db_uri:
            os.environ['DATABASE_URL'] = original_db_uri
        else:
            os.environ.pop('DATABASE_URL', None)
        os.environ.pop('ALEMBIC_RUNNING', None)


def test_alembic_current_shows_version(temp_db):
    """Test that alembic current shows the migration version after upgrade"""
    db_path, db_uri = temp_db
    
    # Set environment variable to use test database
    original_db_uri = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = db_uri
    os.environ['ALEMBIC_RUNNING'] = 'true'
    
    try:
        # Run alembic upgrade
        subprocess.run(
            ['alembic', 'upgrade', 'head'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True,
            check=True
        )
        
        # Check current version
        result = subprocess.run(
            ['alembic', 'current'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0
        # Should show the revision ID
        assert '03fd3a7c24f0' in result.stdout or 'Initial migration' in result.stdout
        
    finally:
        # Restore original environment
        if original_db_uri:
            os.environ['DATABASE_URL'] = original_db_uri
        else:
            os.environ.pop('DATABASE_URL', None)
        os.environ.pop('ALEMBIC_RUNNING', None)


def test_migration_downgrade_and_upgrade(temp_db):
    """Test that migrations can be downgraded and re-upgraded"""
    db_path, db_uri = temp_db
    
    # Set environment variable to use test database
    original_db_uri = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = db_uri
    os.environ['ALEMBIC_RUNNING'] = 'true'
    
    try:
        # Run alembic upgrade
        subprocess.run(
            ['alembic', 'upgrade', 'head'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True,
            check=True
        )
        
        # Verify tables exist
        engine = create_engine(db_uri)
        inspector = inspect(engine)
        tables_before = set(inspector.get_table_names())
        assert 'workouts' in tables_before
        engine.dispose()
        
        # Downgrade
        result = subprocess.run(
            ['alembic', 'downgrade', 'base'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Downgrade failed: {result.stderr}"
        
        # Verify tables are removed (except alembic_version)
        engine = create_engine(db_uri)
        inspector = inspect(engine)
        tables_after_downgrade = set(inspector.get_table_names())
        assert 'workouts' not in tables_after_downgrade
        assert 'workout_selections' not in tables_after_downgrade
        assert 'custom_workouts' not in tables_after_downgrade
        engine.dispose()
        
        # Upgrade again
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True
        )
        
        assert result.returncode == 0, f"Re-upgrade failed: {result.stderr}"
        
        # Verify tables are back
        engine = create_engine(db_uri)
        inspector = inspect(engine)
        tables_after_upgrade = set(inspector.get_table_names())
        assert 'workouts' in tables_after_upgrade
        assert 'workout_selections' in tables_after_upgrade
        assert 'custom_workouts' in tables_after_upgrade
        engine.dispose()
        
    finally:
        # Restore original environment
        if original_db_uri:
            os.environ['DATABASE_URL'] = original_db_uri
        else:
            os.environ.pop('DATABASE_URL', None)
        os.environ.pop('ALEMBIC_RUNNING', None)


def test_app_works_with_migrated_database(temp_db):
    """Test that the Flask app works correctly with a database created by migrations"""
    db_path, db_uri = temp_db
    
    # Set environment variable to use test database
    original_db_uri = os.environ.get('DATABASE_URL')
    os.environ['DATABASE_URL'] = db_uri
    os.environ['ALEMBIC_RUNNING'] = 'true'
    
    try:
        # Run alembic upgrade
        subprocess.run(
            ['alembic', 'upgrade', 'head'],
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True,
            check=True
        )
        
        # Now unset ALEMBIC_RUNNING so app can use the database
        os.environ.pop('ALEMBIC_RUNNING', None)
        
        # Create app with test database
        app = create_app('development')
        app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
        app.config['TESTING'] = True
        
        with app.app_context():
            from models import Workout
            from datetime import date
            
            # Try to create a workout
            workout = Workout(
                title='Test Workout',
                workout_type='Bike',
                workout_day=date(2026, 1, 15)
            )
            db.session.add(workout)
            db.session.commit()
            
            # Verify it was created
            found = Workout.query.filter_by(title='Test Workout').first()
            assert found is not None
            assert found.title == 'Test Workout'
            assert found.workout_type == 'Bike'
        
    finally:
        # Restore original environment
        if original_db_uri:
            os.environ['DATABASE_URL'] = original_db_uri
        else:
            os.environ.pop('DATABASE_URL', None)
        os.environ.pop('ALEMBIC_RUNNING', None)
