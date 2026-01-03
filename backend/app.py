"""
Flask API for workout planner
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import config
from models import db, Workout, WorkoutSelection, CustomWorkout
from datetime import datetime, date, timezone
import csv
import io
import os


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
            if 'currentPlanDay' in data and data['currentPlanDay']:
                selection.current_plan_day = datetime.fromisoformat(data['currentPlanDay']).date()
            if 'timeOfDay' in data:
                selection.time_of_day = data['timeOfDay']
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
            "timeOfDay": "Saturday 8am"
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
                time_of_day=data.get('timeOfDay')
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


# Create the default app instance
app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
