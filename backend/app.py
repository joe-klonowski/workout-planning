"""
Flask API for workout planner
"""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from config import config, Config
from models import db, Workout, WorkoutSelection, User
from auth import generate_token, verify_token, token_required
from caldav_client import CalDAVClient
from datetime import datetime, date, timezone
import csv
import io
import os
import logging
import sys

# Configure logging to output to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)


def create_app(config_name='development'):
    """Application factory"""
    # Set up static folder for production
    static_folder = None
    if config_name == 'production':
        static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app', 'build')
        logger.info(f"Production mode: static folder set to {static_folder}")
        logger.info(f"Static folder exists: {os.path.exists(static_folder) if static_folder else 'N/A'}")
    
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config.from_object(config[config_name])
    
    logger.info(f"App created with config: {config_name}")
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS
    if config_name == 'production':
        # In production, frontend is served from same origin
        # Use same-origin policy - no CORS needed for same-origin requests
        # But configure CORS to allow proper headers for API endpoints
        CORS(app, resources={r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False  # No credentials needed for same-origin
        }})
    else:
        # In development, allow requests from the React dev server
        CORS(app, resources={r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }})
    
    # Register routes
    register_routes(app)
    
    # Create tables only if they don't exist (skip if running Alembic migrations)
    if not os.environ.get('ALEMBIC_RUNNING'):
        with app.app_context():
            try:
                db.create_all()
            except Exception as e:
                # Tables already exist, that's fine
                logger.warning(f"Could not create tables (they may already exist): {e}")
    
    return app


def register_routes(app):
    """Register all API routes"""
    
    # ============= AUTH ENDPOINTS =============

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        """
        Registration endpoint is disabled.
        This is a single-user app. Use the create_user.py script to set up the initial user.
        """
        return jsonify({
            'error': 'Registration is disabled. This is a single-user app. Use the create_user.py script to set up your account.'
        }), 403


    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """
        Login with username and password
        Body: {
            "username": "joe",
            "password": "securepassword"
        }
        """
        print("=== LOGIN ENDPOINT CALLED ===", flush=True)
        try:
            # Debug logging
            print(f"Content-Type: {request.content_type}", flush=True)
            print(f"Request data: {request.data}", flush=True)
            print(f"Request headers: {dict(request.headers)}", flush=True)
            
            logger.info(f"Login request received. Content-Type: {request.content_type}")
            logger.info(f"Request data length: {len(request.data)}")
            logger.info(f"Request headers: {dict(request.headers)}")
            
            data = request.get_json(force=True)
            print(f"Parsed JSON data: {data}", flush=True)
            
            if not data or not data.get('username') or not data.get('password'):
                print(f"ERROR: Missing credentials. Data: {data}", flush=True)
                logger.error(f"Missing credentials. Data received: {data}")
                return jsonify({'error': 'Username and password are required'}), 400
            
            username = data.get('username', '')
            password = data.get('password', '')
            
            print(f"Attempting login for username: {username}", flush=True)
            
            # Find user
            user = User.query.filter_by(username=username).first()
            if not user:
                print(f"ERROR: User '{username}' not found in database", flush=True)
                # List all users for debugging
                all_users = User.query.all()
                print(f"Total users in database: {len(all_users)}", flush=True)
                for u in all_users:
                    print(f"  - User: {u.username}", flush=True)
                return jsonify({'error': 'Invalid username or password'}), 401
            
            if not user.check_password(password):
                print(f"ERROR: Invalid password for user: {username}", flush=True)
                return jsonify({'error': 'Invalid username or password'}), 401
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            db.session.commit()
            
            # Generate token
            token = generate_token(user.id)
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Login error: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500


    @app.route('/api/auth/verify', methods=['GET'])
    @token_required
    def verify_auth(current_user_id):
        """
        Verify that the provided token is valid
        Requires: Authorization header with Bearer token
        """
        try:
            user = db.session.get(User, current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({
                'valid': True,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Token verification error: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500


    @app.route('/api/auth/me', methods=['GET'])
    @token_required
    def get_current_user(current_user_id):
        """
        Get current logged-in user
        Requires: Authorization header with Bearer token
        """
        try:
            user = db.session.get(User, current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Get user error: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500
    
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


    @app.route('/api/workouts', methods=['POST'])
    def create_workout():
        """
        Create a new workout (including custom workouts)
        Body: {
            "title": "Group Ride",
            "workoutType": "Bike",
            "workoutDescription": "Weekly group ride",
            "originallyPlannedDay": "2026-01-15",
            "plannedDuration": 2.0,
            "plannedDistanceInMeters": 50000.0,
            "tss": 120.0,
            "isCustom": true,
            "timeOfDay": "Saturday 8am" (optional),
            "workoutLocation": "outdoor" (optional)
        }
        """
        try:
            data = request.get_json()
            
            workout = Workout(
                title=data.get('title', ''),
                workout_type=data.get('workoutType', 'Other'),
                workout_description=data.get('workoutDescription', ''),
                originally_planned_day=datetime.fromisoformat(data['originallyPlannedDay']).date(),
                planned_duration=data.get('plannedDuration'),
                planned_distance_meters=data.get('plannedDistanceInMeters'),
                coach_comments=data.get('coachComments'),
                tss=data.get('tss'),
                intensity_factor=data.get('intensityFactor'),
                is_custom=data.get('isCustom', False)
            )
            
            db.session.add(workout)
            db.session.flush()  # Flush to get the workout ID
            
            # Create selection if time_of_day or workout_location are provided
            if data.get('timeOfDay') or data.get('workoutLocation'):
                selection = WorkoutSelection(
                    workout_id=workout.id,
                    is_selected=True,
                    time_of_day=data.get('timeOfDay'),
                    workout_location=data.get('workoutLocation')
                )
                db.session.add(selection)
            
            db.session.commit()
            
            return jsonify(workout.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/api/workouts/<int:workout_id>', methods=['PUT'])
    def update_workout(workout_id):
        """Update a workout (for custom workouts or modifying planned workouts)"""
        try:
            workout = db.session.get(Workout, workout_id)
            if not workout:
                return jsonify({'error': 'Workout not found'}), 404
            data = request.get_json()
            
            # Update workout fields
            if 'title' in data:
                workout.title = data['title']
            if 'workoutType' in data:
                workout.workout_type = data['workoutType']
            if 'workoutDescription' in data:
                workout.workout_description = data['workoutDescription']
            if 'originallyPlannedDay' in data:
                workout.originally_planned_day = datetime.fromisoformat(data['originallyPlannedDay']).date()
            if 'plannedDuration' in data:
                workout.planned_duration = data['plannedDuration']
            if 'plannedDistanceInMeters' in data:
                workout.planned_distance_meters = data['plannedDistanceInMeters']
            if 'tss' in data:
                workout.tss = data['tss']
            if 'coachComments' in data:
                workout.coach_comments = data['coachComments']
            if 'intensityFactor' in data:
                workout.intensity_factor = data['intensityFactor']
            
            # Update or create selection for time_of_day and workout_location
            if 'timeOfDay' in data or 'workoutLocation' in data:
                selection = workout.selection
                if not selection:
                    selection = WorkoutSelection(workout_id=workout.id, is_selected=True)
                    db.session.add(selection)
                
                if 'timeOfDay' in data:
                    selection.time_of_day = data['timeOfDay']
                if 'workoutLocation' in data:
                    selection.workout_location = data['workoutLocation']
            
            db.session.commit()
            
            return jsonify(workout.to_dict()), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    @app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
    def delete_workout(workout_id):
        """Delete a workout (typically for custom workouts)"""
        try:
            workout = db.session.get(Workout, workout_id)
            if not workout:
                return jsonify({'error': 'Workout not found'}), 404
            db.session.delete(workout)
            db.session.commit()
            return jsonify({'message': 'Workout deleted'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


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
                
                # Parse optional performance fields
                if_val = float(row['IF']) if row.get('IF') else None
                time_total_hours = float(row['TimeTotalInHours']) if row.get('TimeTotalInHours') else None
                tss_val = float(row['TSS']) if row.get('TSS') else None

                # Calculate TSS if missing and IF/time data available (TSS = duration_hours * IF^2 * 100)
                if tss_val is None and if_val and time_total_hours:
                    try:
                        tss_val = time_total_hours * (if_val ** 2) * 100
                    except Exception:
                        tss_val = None

                # Create new workout
                workout = Workout(
                    title=row.get('Title', ''),
                    workout_type=row.get('WorkoutType', 'Other'),
                    workout_description=row.get('WorkoutDescription', ''),
                    planned_duration=float(row['PlannedDuration']) if row.get('PlannedDuration') else None,
                    planned_distance_meters=float(row['PlannedDistanceInMeters']) if row.get('PlannedDistanceInMeters') else None,
                    originally_planned_day=originally_planned_day,
                    coach_comments=row.get('CoachComments', ''),
                    tss=tss_val,
                    intensity_factor=if_val
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
            custom_workouts = Workout.query.filter_by(is_custom=True).count()
            
            return jsonify({
                'totalWorkouts': total_workouts,
                'selectedWorkouts': selected_workouts,
                'customWorkouts': custom_workouts
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


# ============= TRI CLUB SCHEDULE ENDPOINTS =============

    @app.route('/api/tri-club-schedule', methods=['GET'])
    def get_tri_club_schedule():
        """
        Get the tri club schedule from the config file
        Returns: {
            "effective_date": "2026-01-01",
            "schedule": {
                "monday": [{"time": "07:00", "activity": "Ride"}, ...],
                ...
            }
        }
        """
        try:
            import json
            from pathlib import Path
            
            # Path to the tri club schedule config file
            config_path = Path(__file__).parent.parent / 'config' / 'tri_club_schedule.json'
            
            if not config_path.exists():
                return jsonify({'error': 'Tri club schedule file not found'}), 404
            
            with open(config_path, 'r') as f:
                schedule_data = json.load(f)
            
            return jsonify(schedule_data), 200
            
        except Exception as e:
            logger.error(f"Error loading tri club schedule: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500


    @app.route('/api/weekly-targets', methods=['GET'])
    def get_weekly_targets():
        """
        Get the weekly targets from the config file
        Returns: {
            "week_start_date": "2026-01-05",
            "weekly_targets": {
                "tss": 460,
                "total_time": {"hours": 11, "minutes": 33},
                "by_discipline": {
                    "swim": {"hours": 1, "minutes": 48},
                    "bike": {"hours": 4, "minutes": 30},
                    "run": {"hours": 3, "minutes": 15},
                    "strength": {"hours": 2, "minutes": 0}
                }
            }
        }
        """
        try:
            import json
            from pathlib import Path
            
            # Path to the weekly targets config file
            config_path = Path(__file__).parent.parent / 'config' / 'weekly_targets.json'
            
            if not config_path.exists():
                return jsonify({'error': 'Weekly targets file not found'}), 404
            
            with open(config_path, 'r') as f:
                targets_data = json.load(f)
            
            return jsonify(targets_data), 200
            
        except Exception as e:
            logger.error(f"Error loading weekly targets: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/weather', methods=['GET'])
    def get_weather():
        """
        Get weather forecast for Chicago
        Query parameters:
            - start_date: ISO format date (default: today)
            - end_date: ISO format date (default: 7 days from start)
        
        Returns: {
            "latitude": 41.795604164195446,
            "longitude": -87.57838836383468,
            "timezone": "America/Chicago",
            "dates": ["2026-01-10", "2026-01-11"],
            "temperatures": [32.5, 35.2],
            "rain_probability": [20, 60],
            "windspeed": [10.5, 15.3],
            "weather_codes": [2, 51]
        }
        """
        try:
            from weather_client import WeatherClient, WeatherAPIError
            
            # Get date parameters from query string
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            
            start_date = None
            end_date = None
            
            if start_date_str:
                start_date = datetime.fromisoformat(start_date_str).date()
            if end_date_str:
                end_date = datetime.fromisoformat(end_date_str).date()
            
            client = WeatherClient()
            forecast = client.get_forecast(start_date, end_date)
            
            return jsonify(forecast), 200
        
        except WeatherAPIError as e:
            logger.warning(f"Weather API error: {e}")
            return jsonify({'error': str(e)}), 503
        except ValueError as e:
            logger.warning(f"Invalid date format: {e}")
            return jsonify({'error': f'Invalid date format. Use ISO format (YYYY-MM-DD): {e}'}), 400
        except Exception as e:
            logger.error(f"Error fetching weather: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/weather/<date_str>', methods=['GET'])
    def get_daily_weather(date_str):
        """
        Get weather forecast for a specific date
        
        Returns: {
            "date": "2026-01-10",
            "temperature": 35.5,
            "rain_probability": 40,
            "windspeed": 12.3,
            "weather_code": 61,
            "description": "Slight rain"
        }
        """
        try:
            from weather_client import WeatherClient, WeatherAPIError
            
            forecast_date = datetime.fromisoformat(date_str).date()
            
            client = WeatherClient()
            daily_forecast = client.get_daily_forecast(forecast_date)
            
            return jsonify(daily_forecast), 200
        
        except WeatherAPIError as e:
            logger.warning(f"Weather API error: {e}")
            return jsonify({'error': str(e)}), 503
        except ValueError as e:
            logger.warning(f"Invalid date format: {e}")
            return jsonify({'error': f'Invalid date format. Use ISO format (YYYY-MM-DD): {e}'}), 400
        except Exception as e:
            logger.error(f"Error fetching daily weather: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/weather/by-time-of-day/<date_str>', methods=['GET'])
    def get_weather_by_time_of_day(date_str):
        """
        Get weather forecast grouped by time of day (morning, afternoon, evening)
        
        Returns: {
            "date": "2026-01-10",
            "morning": {
                "temperature": 32.5,
                "rain_probability": 20,
                "windspeed": 10.5,
                "weather_code": 2,
                "description": "Partly cloudy"
            },
            "afternoon": {...},
            "evening": {...}
        }
        """
        try:
            from weather_client import WeatherClient, WeatherAPIError
            from datetime import datetime
            
            forecast_date = datetime.fromisoformat(date_str).date()
            
            client = WeatherClient()
            forecast = client.get_weather_by_time_of_day(forecast_date)
            
            return jsonify(forecast), 200
        
        except WeatherAPIError as e:
            logger.warning(f"Weather API error: {e}")
            return jsonify({'error': str(e)}), 503
        except ValueError as e:
            logger.warning(f"Invalid date format: {e}")
            return jsonify({'error': f'Invalid date format. Use ISO format (YYYY-MM-DD): {e}'}), 400
        except Exception as e:
            logger.error(f"Error fetching time-of-day weather: {e}", exc_info=True)
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
            logger.info(f"Retrieved CalDAV credentials - URL: {credentials.get('url')}, "
                       f"Username: {credentials.get('username')}, "
                       f"Password: {'***' if credentials.get('password') else 'not set'}, "
                       f"Calendar Name: {credentials.get('calendar_name')}")
            
            if not credentials['url'] or not credentials['username'] or not credentials['password']:
                return jsonify({
                    'error': 'CalDAV credentials not configured. Please set CALDAV_URL, CALDAV_USERNAME, and CALDAV_PASSWORD environment variables.'
                }), 500
            
            if not credentials['calendar_name']:
                return jsonify({
                    'error': 'CalDAV calendar name not configured. Please set CALDAV_CALENDAR_NAME environment variable.'
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
            
            export_result = caldav_client.export_workout_plan(workouts_by_date)

            # Expect a structured result: {'createdCount': int, 'results': [ ... ]}
            if not isinstance(export_result, dict) or 'createdCount' not in export_result or 'results' not in export_result:
                logger.error(f"export_workout_plan returned unexpected result: {export_result}")
                caldav_client.disconnect()
                return jsonify({'error': 'Internal error exporting workouts'}), 500

            events_created = export_result['createdCount']
            results = export_result['results']

            caldav_client.disconnect()

            return jsonify({
                'message': f'Successfully exported workouts to calendar',
                'eventsCreated': events_created,
                'results': results,
                'dateRange': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Error exporting to calendar: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    # ============= STATIC FILE SERVING (PRODUCTION) =============
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        """
        Serve React app in production.
        In development, the React app runs on its own server (port 3000).
        """
        if app.config.get('ENV') == 'production' or os.environ.get('FLASK_ENV') == 'production':
            if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
                return send_from_directory(app.static_folder, path)
            else:
                return send_from_directory(app.static_folder, 'index.html')
        else:
            # In development, redirect to the React dev server
            return jsonify({
                'message': 'API is running. Frontend is available at http://localhost:3000'
            }), 200


# Create the default app instance
config_name = os.environ.get('FLASK_ENV', 'development')
logger.info(f"Creating app with config_name: {config_name}")
logger.info(f"PORT environment variable: {os.environ.get('PORT', 'not set')}")

try:
    app = create_app(config_name)
    logger.info("App created successfully")
except Exception as e:
    logger.error(f"Failed to create app: {e}", exc_info=True)
    raise


if __name__ == '__main__':
    app.run(debug=True, port=5000)
