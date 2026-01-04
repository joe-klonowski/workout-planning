"""
Flask API for workout planner
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import config, Config
from models import db, Workout, WorkoutSelection, CustomWorkout
from caldav_client import CalDAVClient
from datetime import datetime, date, timezone
import csv
import io
import os
import logging

logger = logging.getLogger(__name__)


def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register routes
    register_routes(app)
    
    # Create tables (skip if running Alembic migrations)
    if not os.environ.get('ALEMBIC_RUNNING'):
        with app.app_context():
            db.create_all()
    
    return app


def register_routes(app):
    """Register all API routes"""
    
    # ============= WORKOUT ENDPOINTS =============

    @app.route('/api/workouts', methods=['GET'])
    def get_workouts():
        """Get all workouts with their selections"""
        try:
            workouts = Workout.query.order_by(Workout.originally_planned_day).all()
            return jsonify({
                'workouts': [w.to_dict() for w in workouts],
                'count': len(workouts)
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/api/workouts/<int:workout_id>', methods=['GET'])
    def get_workout(workout_id):
        """Get a specific workout by ID"""
        try:
            workout = db.session.get(Workout, workout_id)
            if not workout:
                return jsonify({'error': 'Workout not found'}), 404
            return jsonify(workout.to_dict()), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 404


    @app.route('/api/workouts/import', methods=['POST'])
    def import_workouts():
        """
        Import workouts from CSV data
        Expects CSV content in request body or file upload
        """
        try:
            # Get CSV data from request
            if 'file' in request.files:
                file = request.files['file']
                csv_data = file.read().decode('utf-8')
            else:
                csv_data = request.get_data(as_text=True)
            
            if not csv_data:
                return jsonify({'error': 'No CSV data provided'}), 400
            
            # Parse CSV
            csv_reader = csv.DictReader(io.StringIO(csv_data))
            imported_count = 0
            
            for row in csv_reader:
                # Parse workout day
                originally_planned_day = None
                if row.get('WorkoutDay'):
                    try:
                        originally_planned_day = datetime.strptime(row['WorkoutDay'], '%Y-%m-%d').date()
                    except ValueError:
                        continue  # Skip rows with invalid dates
                
                if not originally_planned_day:
                    continue
                
                # Check if workout already exists (avoid duplicates)
                existing = Workout.query.filter_by(
                    title=row.get('Title', ''),
                    originally_planned_day=originally_planned_day
                ).first()
                
                if existing:
                    continue  # Skip duplicates
                
                # Create new workout
                workout = Workout(
                    title=row.get('Title', ''),
                    workout_type=row.get('WorkoutType', 'Other'),
                    workout_description=row.get('WorkoutDescription', ''),
                    planned_duration=float(row['PlannedDuration']) if row.get('PlannedDuration') else None,
                    planned_distance_meters=float(row['PlannedDistanceInMeters']) if row.get('PlannedDistanceInMeters') else None,
                    originally_planned_day=originally_planned_day,
                    coach_comments=row.get('CoachComments', ''),
                    tss=float(row['TSS']) if row.get('TSS') else None,
                    intensity_factor=float(row['IF']) if row.get('IF') else None
                )
                
                db.session.add(workout)
                imported_count += 1
            
            db.session.commit()
            
            return jsonify({
                'message': f'Successfully imported {imported_count} workouts',
                'imported': imported_count
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


# ============= WORKOUT SELECTION ENDPOINTS =============

    @app.route('/api/selections/<int:workout_id>', methods=['PUT', 'POST'])
    def update_selection(workout_id):
        """
        Create or update a workout selection
        Body: {
            "isSelected": true/false,
            "currentPlanDay": "2026-01-15" (optional),
            "timeOfDay": "morning" (optional),
            "workoutLocation": "indoor" | "outdoor" | null (optional),
            "userNotes": "..." (optional)
        }
        """
        try:
            workout = db.session.get(Workout, workout_id)
            if not workout:
                return jsonify({'error': 'Workout not found'}), 404
            data = request.get_json()
            
            # Get or create selection
            selection = workout.selection
            if not selection:
                selection = WorkoutSelection(workout_id=workout_id)
                db.session.add(selection)
            
            # Update fields
            if 'isSelected' in data:
                selection.is_selected = data['isSelected']
                # When a workout is deselected, clear the time of day
                if not data['isSelected']:
                    selection.time_of_day = None
            if 'currentPlanDay' in data and data['currentPlanDay']:
                selection.current_plan_day = datetime.fromisoformat(data['currentPlanDay']).date()
            if 'timeOfDay' in data:
                selection.time_of_day = data['timeOfDay']
            if 'workoutLocation' in data:
                selection.workout_location = data['workoutLocation']
            if 'userNotes' in data:
                selection.user_notes = data['userNotes']
            
            db.session.commit()
            
            return jsonify(selection.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/api/selections/<int:workout_id>', methods=['DELETE'])
    def delete_selection(workout_id):
        """Delete a workout selection (resets to defaults)"""
        try:
            workout = db.session.get(Workout, workout_id)
            if not workout:
                return jsonify({'error': 'Workout not found'}), 404
            if workout.selection:
                db.session.delete(workout.selection)
                db.session.commit()
            return jsonify({'message': 'Selection deleted'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


# ============= CUSTOM WORKOUT ENDPOINTS =============

    @app.route('/api/custom-workouts', methods=['GET'])
    def get_custom_workouts():
        """Get all custom workouts"""
        try:
            workouts = CustomWorkout.query.order_by(CustomWorkout.planned_date).all()
            return jsonify({
                'customWorkouts': [w.to_dict() for w in workouts],
                'count': len(workouts)
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/api/custom-workouts', methods=['POST'])
    def create_custom_workout():
        """
        Create a new custom workout
        Body: {
            "title": "Group Ride",
            "workoutType": "Bike",
            "description": "Weekly group ride",
            "plannedDate": "2026-01-15",
            "plannedDuration": 2.0,
            "timeOfDay": "Saturday 8am",
            "workoutLocation": "outdoor" (optional)
        }
        """
        try:
            data = request.get_json()
            
            workout = CustomWorkout(
                title=data.get('title', ''),
                workout_type=data.get('workoutType', 'Other'),
                description=data.get('description', ''),
                planned_date=datetime.fromisoformat(data['plannedDate']).date(),
                planned_duration=data.get('plannedDuration'),
                time_of_day=data.get('timeOfDay'),
                workout_location=data.get('workoutLocation')
            )
            
            db.session.add(workout)
            db.session.commit()
            
            return jsonify(workout.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/api/custom-workouts/<int:workout_id>', methods=['PUT'])
    def update_custom_workout(workout_id):
        """Update a custom workout"""
        try:
            workout = db.session.get(CustomWorkout, workout_id)
            if not workout:
                return jsonify({'error': 'Custom workout not found'}), 404
            data = request.get_json()
            
            if 'title' in data:
                workout.title = data['title']
            if 'workoutType' in data:
                workout.workout_type = data['workoutType']
            if 'description' in data:
                workout.description = data['description']
            if 'plannedDate' in data:
                workout.planned_date = datetime.fromisoformat(data['plannedDate']).date()
            if 'plannedDuration' in data:
                workout.planned_duration = data['plannedDuration']
            if 'timeOfDay' in data:
                workout.time_of_day = data['timeOfDay']
            if 'workoutLocation' in data:
                workout.workout_location = data['workoutLocation']
            
            db.session.commit()
            
            return jsonify(workout.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/api/custom-workouts/<int:workout_id>', methods=['DELETE'])
    def delete_custom_workout(workout_id):
        """Delete a custom workout"""
        try:
            workout = db.session.get(CustomWorkout, workout_id)
            if not workout:
                return jsonify({'error': 'Custom workout not found'}), 404
            db.session.delete(workout)
            db.session.commit()
            return jsonify({'message': 'Custom workout deleted'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


# ============= UTILITY ENDPOINTS =============

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200


    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get workout statistics"""
        try:
            total_workouts = Workout.query.count()
            selected_workouts = WorkoutSelection.query.filter_by(is_selected=True).count()
            custom_workouts = CustomWorkout.query.count()
            
            return jsonify({
                'totalWorkouts': total_workouts,
                'selectedWorkouts': selected_workouts,
                'customWorkouts': custom_workouts
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


# ============= CALDAV EXPORT ENDPOINTS =============

    @app.route('/api/export/calendar', methods=['POST'])
    def export_to_calendar():
        """
        Export workouts to Apple Calendar via CalDAV
        Body: {
            "startDate": "2026-01-06",
            "endDate": "2026-01-12"
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'startDate' not in data or 'endDate' not in data:
                return jsonify({'error': 'startDate and endDate are required'}), 400
            
            # Parse dates
            start_date = datetime.fromisoformat(data['startDate']).date()
            end_date = datetime.fromisoformat(data['endDate']).date()
            
            if start_date > end_date:
                return jsonify({'error': 'startDate must be before or equal to endDate'}), 400
            
            # Get CalDAV credentials
            credentials = Config.get_caldav_credentials()
            if not credentials['url'] or not credentials['username'] or not credentials['password']:
                return jsonify({
                    'error': 'CalDAV credentials not configured. Please set up credentials in ~/.config/workout-planner/caldav-credentials-apple.env'
                }), 500
            
            if not credentials['calendar_name']:
                return jsonify({
                    'error': 'CalDAV calendar name not configured. Please set CALDAV_CALENDAR_NAME in ~/.config/workout-planner/caldav-credentials-apple.env'
                }), 500
            
            # Get workouts in the date range
            workouts = Workout.query.filter(
                Workout.originally_planned_day >= start_date,
                Workout.originally_planned_day <= end_date
            ).all()
            
            # Group workouts by date (using currentPlanDay if moved, otherwise originallyPlannedDay)
            workouts_by_date = {}
            for workout in workouts:
                # Skip unselected workouts
                if workout.selection and not workout.selection.is_selected:
                    continue
                
                # Determine the display date
                display_date = workout.selection.current_plan_day if (workout.selection and workout.selection.current_plan_day) else workout.originally_planned_day
                
                # Skip if the workout was moved outside the date range
                if display_date < start_date or display_date > end_date:
                    continue
                
                if display_date not in workouts_by_date:
                    workouts_by_date[display_date] = []
                
                workout_data = {
                    'workoutType': workout.workout_type,
                    'workoutLocation': workout.selection.workout_location if workout.selection else None,
                    'timeOfDay': workout.selection.time_of_day if workout.selection else 'Not specified',
                    'plannedDuration': workout.planned_duration
                }
                workouts_by_date[display_date].append(workout_data)
            
            # Connect to CalDAV and export
            caldav_client = CalDAVClient(
                url=credentials['url'],
                username=credentials['username'],
                password=credentials['password']
            )
            
            caldav_client.connect()
            caldav_client.select_calendar(credentials.get('calendar_name'))
            
            # Delete existing workout events in the date range to prevent duplicates
            deleted_count = caldav_client.delete_workout_events_in_range(start_date, end_date)
            logger.info(f"Deleted {deleted_count} existing workout events in range {start_date} to {end_date}")
            
            events_created = caldav_client.export_workout_plan(workouts_by_date)
            
            caldav_client.disconnect()
            
            return jsonify({
                'message': f'Successfully exported workouts to calendar',
                'eventsCreated': events_created,
                'dateRange': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Error exporting to calendar: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500


# Create the default app instance
app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
