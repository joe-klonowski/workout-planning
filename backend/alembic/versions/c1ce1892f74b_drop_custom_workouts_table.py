"""Drop custom_workouts table

Revision ID: c1ce1892f74b
Revises: 2d0684384a10
Create Date: 2026-01-05 17:03:01.648672

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1ce1892f74b'
down_revision: Union[str, None] = '2d0684384a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop the custom_workouts table since data has been migrated to workouts table"""
    op.drop_table('custom_workouts')


def downgrade() -> None:
    """Recreate custom_workouts table if needed"""
    op.create_table('custom_workouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('workout_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('planned_date', sa.Date(), nullable=False),
        sa.Column('planned_duration', sa.Float(), nullable=True),
        sa.Column('planned_distance_meters', sa.Float(), nullable=True),
        sa.Column('tss', sa.Float(), nullable=True),
        sa.Column('time_of_day', sa.String(length=50), nullable=True),
        sa.Column('workout_location', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
