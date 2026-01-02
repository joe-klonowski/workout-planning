"""
Database models for workout planner
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()


class Workout(db.Model):
    """
    Workout represents the original workout from TrainingPeaks CSV
    Immutable once imported
    """
    __tablename__ = 'workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Core workout data from CSV
    title = db.Column(db.String(500), nullable=False)
    workout_type = db.Column(db.String(100), nullable=False)
    workout_description = db.Column(db.Text)
    planned_duration = db.Column(db.Float)  # in hours
    planned_distance_meters = db.Column(db.Float)
    workout_day = db.Column(db.Date, nullable=False)
    coach_comments = db.Column(db.Text)
    
    # Optional metadata
    tss = db.Column(db.Float)
    intensity_factor = db.Column(db.Float)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    selection = db.relationship('WorkoutSelection', backref='workout', uselist=False, 
                               cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert workout to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'workoutType': self.workout_type,
            'workoutDescription': self.workout_description,
            'plannedDuration': self.planned_duration,
            'plannedDistanceInMeters': self.planned_distance_meters,
            'workoutDay': self.workout_day.isoformat() if self.workout_day else None,
            'coachComments': self.coach_comments,
            'tss': self.tss,
            'intensityFactor': self.intensity_factor,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'selection': self.selection.to_dict() if self.selection else None
        }


class WorkoutSelection(db.Model):
    """
    WorkoutSelection tracks user modifications to their workout plan
    - Whether they selected/skipped a workout
    - If they moved it to a different day
    - Custom time of day
    """
    __tablename__ = 'workout_selections'
    
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    
    # User's choices
    is_selected = db.Column(db.Boolean, default=True)  # True = planning to do it
    actual_date = db.Column(db.Date)  # If moved from original date
    time_of_day = db.Column(db.String(50))  # e.g., "morning", "7am", "Tuesday evening"
    
    # Notes
    user_notes = db.Column(db.Text)
    
    # Timestamps
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert selection to dictionary"""
        return {
            'id': self.id,
            'workoutId': self.workout_id,
            'isSelected': self.is_selected,
            'actualDate': self.actual_date.isoformat() if self.actual_date else None,
            'timeOfDay': self.time_of_day,
            'userNotes': self.user_notes,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class CustomWorkout(db.Model):
    """
    CustomWorkout represents user-created workouts not from TrainingPeaks
    e.g., recurring group rides
    """
    __tablename__ = 'custom_workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    title = db.Column(db.String(500), nullable=False)
    workout_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    planned_date = db.Column(db.Date, nullable=False)
    planned_duration = db.Column(db.Float)
    time_of_day = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert custom workout to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'workoutType': self.workout_type,
            'description': self.description,
            'plannedDate': self.planned_date.isoformat() if self.planned_date else None,
            'plannedDuration': self.planned_duration,
            'timeOfDay': self.time_of_day,
            'isCustom': True,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
