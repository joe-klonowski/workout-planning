"""
Database models for workout planner
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, timezone

db = SQLAlchemy()


class Workout(db.Model):
    """
    Workout represents workouts from TrainingPeaks CSV or custom user-created workouts
    Immutable once imported (for coach workouts)
    """
    __tablename__ = 'workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Core workout data from CSV
    title = db.Column(db.String(500), nullable=False)
    workout_type = db.Column(db.String(100), nullable=False)
    workout_description = db.Column(db.Text)
    planned_duration = db.Column(db.Float)  # in hours
    planned_distance_meters = db.Column(db.Float)
    originally_planned_day = db.Column(db.Date, nullable=False)
    coach_comments = db.Column(db.Text)
    
    # Optional metadata
    tss = db.Column(db.Float)
    intensity_factor = db.Column(db.Float)
    
    # Custom workout flag
    is_custom = db.Column(db.Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
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
            'originallyPlannedDay': self.originally_planned_day.isoformat() if self.originally_planned_day else None,
            'coachComments': self.coach_comments,
            'tss': self.tss,
            'intensityFactor': self.intensity_factor,
            'isCustom': self.is_custom,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'selection': self.selection.to_dict() if self.selection else None
        }


class WorkoutSelection(db.Model):
    """
    WorkoutSelection tracks user modifications to their workout plan
    - Whether they selected/skipped a workout
    - If they moved it to a different day
    - Custom time of day
    - Workout location (e.g., indoor, outdoor)
    """
    __tablename__ = 'workout_selections'
    
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    
    # User's choices
    is_selected = db.Column(db.Boolean, default=True)  # True = planning to do it
    current_plan_day = db.Column(db.Date)  # If moved from original date
    time_of_day = db.Column(db.String(50))  # e.g., "morning", "7am", "Tuesday evening"
    workout_location = db.Column(db.String(100))  # e.g., "indoor", "outdoor" (NULL if unmarked)
    
    # Notes
    user_notes = db.Column(db.Text)
    
    # Timestamps
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        """Convert selection to dictionary"""
        return {
            'id': self.id,
            'workoutId': self.workout_id,
            'isSelected': self.is_selected,
            'currentPlanDay': self.current_plan_day.isoformat() if self.current_plan_day else None,
            'timeOfDay': self.time_of_day,
            'workoutLocation': self.workout_location,
            'userNotes': self.user_notes,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

