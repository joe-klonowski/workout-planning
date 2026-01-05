"""Migrate custom workouts to workouts table

Revision ID: 2d0684384a10
Revises: 4a7ad922aa06
Create Date: 2026-01-05 16:58:19.703326

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision: str = '2d0684384a10'
down_revision: Union[str, None] = '4a7ad922aa06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Migrate custom workouts to workouts table.
    - Copy all custom_workouts records to workouts table with is_custom=True
    - Create workout_selections records for time_of_day and workout_location
    """
    # Get database connection
    conn = op.get_bind()
    
    # Define table references
    custom_workouts = table('custom_workouts',
        column('id', sa.Integer),
        column('title', sa.String),
        column('workout_type', sa.String),
        column('description', sa.Text),
        column('planned_date', sa.Date),
        column('planned_duration', sa.Float),
        column('planned_distance_meters', sa.Float),
        column('tss', sa.Float),
        column('time_of_day', sa.String),
        column('workout_location', sa.String),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )
    
    workouts = table('workouts',
        column('id', sa.Integer),
        column('title', sa.String),
        column('workout_type', sa.String),
        column('workout_description', sa.Text),
        column('planned_duration', sa.Float),
        column('planned_distance_meters', sa.Float),
        column('originally_planned_day', sa.Date),
        column('coach_comments', sa.Text),
        column('tss', sa.Float),
        column('intensity_factor', sa.Float),
        column('is_custom', sa.Boolean),
        column('created_at', sa.DateTime)
    )
    
    workout_selections = table('workout_selections',
        column('id', sa.Integer),
        column('workout_id', sa.Integer),
        column('is_selected', sa.Boolean),
        column('current_plan_day', sa.Date),
        column('time_of_day', sa.String),
        column('workout_location', sa.String),
        column('user_notes', sa.Text),
        column('updated_at', sa.DateTime)
    )
    
    # Query all custom workouts
    custom_workout_records = conn.execute(
        sa.select(
            custom_workouts.c.id,
            custom_workouts.c.title,
            custom_workouts.c.workout_type,
            custom_workouts.c.description,
            custom_workouts.c.planned_date,
            custom_workouts.c.planned_duration,
            custom_workouts.c.planned_distance_meters,
            custom_workouts.c.tss,
            custom_workouts.c.time_of_day,
            custom_workouts.c.workout_location,
            custom_workouts.c.created_at,
            custom_workouts.c.updated_at
        )
    ).fetchall()
    
    # Migrate each custom workout
    for cw in custom_workout_records:
        # Insert into workouts table with is_custom=True
        result = conn.execute(
            workouts.insert().values(
                title=cw.title,
                workout_type=cw.workout_type,
                workout_description=cw.description,
                planned_duration=cw.planned_duration,
                planned_distance_meters=cw.planned_distance_meters,
                originally_planned_day=cw.planned_date,
                coach_comments=None,
                tss=cw.tss,
                intensity_factor=None,
                is_custom=True,
                created_at=cw.created_at if cw.created_at else datetime.now(timezone.utc)
            )
        )
        
        # Get the new workout_id
        new_workout_id = result.lastrowid
        
        # Create workout_selection if time_of_day or workout_location exist
        if cw.time_of_day or cw.workout_location:
            conn.execute(
                workout_selections.insert().values(
                    workout_id=new_workout_id,
                    is_selected=True,
                    current_plan_day=None,  # Custom workouts weren't moved from original date
                    time_of_day=cw.time_of_day,
                    workout_location=cw.workout_location,
                    user_notes=None,
                    updated_at=cw.updated_at if cw.updated_at else datetime.now(timezone.utc)
                )
            )


def downgrade() -> None:
    """
    Reverse the migration by copying custom workouts back to custom_workouts table
    """
    # Get database connection
    conn = op.get_bind()
    
    # Define table references
    workouts = table('workouts',
        column('id', sa.Integer),
        column('title', sa.String),
        column('workout_type', sa.String),
        column('workout_description', sa.Text),
        column('planned_duration', sa.Float),
        column('planned_distance_meters', sa.Float),
        column('originally_planned_day', sa.Date),
        column('tss', sa.Float),
        column('is_custom', sa.Boolean),
        column('created_at', sa.DateTime)
    )
    
    custom_workouts = table('custom_workouts',
        column('id', sa.Integer),
        column('title', sa.String),
        column('workout_type', sa.String),
        column('description', sa.Text),
        column('planned_date', sa.Date),
        column('planned_duration', sa.Float),
        column('planned_distance_meters', sa.Float),
        column('tss', sa.Float),
        column('time_of_day', sa.String),
        column('workout_location', sa.String),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )
    
    workout_selections = table('workout_selections',
        column('workout_id', sa.Integer),
        column('time_of_day', sa.String),
        column('workout_location', sa.String),
        column('updated_at', sa.DateTime)
    )
    
    # Query all custom workouts from workouts table
    custom_workout_records = conn.execute(
        sa.select(
            workouts.c.id,
            workouts.c.title,
            workouts.c.workout_type,
            workouts.c.workout_description,
            workouts.c.originally_planned_day,
            workouts.c.planned_duration,
            workouts.c.planned_distance_meters,
            workouts.c.tss,
            workouts.c.created_at
        ).where(workouts.c.is_custom == True)
    ).fetchall()
    
    # Restore each custom workout
    for workout_rec in custom_workout_records:
        # Get selection data if exists
        selection = conn.execute(
            sa.select(
                workout_selections.c.time_of_day,
                workout_selections.c.workout_location,
                workout_selections.c.updated_at
            ).where(workout_selections.c.workout_id == workout_rec.id)
        ).fetchone()
        
        # Insert back into custom_workouts table
        conn.execute(
            custom_workouts.insert().values(
                title=workout_rec.title,
                workout_type=workout_rec.workout_type,
                description=workout_rec.workout_description,
                planned_date=workout_rec.originally_planned_day,
                planned_duration=workout_rec.planned_duration,
                planned_distance_meters=workout_rec.planned_distance_meters,
                tss=workout_rec.tss,
                time_of_day=selection.time_of_day if selection else None,
                workout_location=selection.workout_location if selection else None,
                created_at=workout_rec.created_at,
                updated_at=selection.updated_at if selection else datetime.now(timezone.utc)
            )
        )
        
        # Delete workout_selection if exists
        if selection:
            conn.execute(
                workout_selections.delete().where(workout_selections.c.workout_id == workout_rec.id)
            )
        
        # Delete from workouts table
        conn.execute(
            workouts.delete().where(workouts.c.id == workout_rec.id)
        )

