"""rename workout_day to originally_planned_day and actual_date to current_plan_day

Revision ID: c8881614f87a
Revises: 03fd3a7c24f0
Create Date: 2026-01-02 21:35:28.790451

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8881614f87a'
down_revision: Union[str, None] = '03fd3a7c24f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns in workouts table
    with op.batch_alter_table('workouts', schema=None) as batch_op:
        batch_op.alter_column('workout_day',
                              new_column_name='originally_planned_day')
    
    # Rename columns in workout_selections table
    with op.batch_alter_table('workout_selections', schema=None) as batch_op:
        batch_op.alter_column('actual_date',
                              new_column_name='current_plan_day')


def downgrade() -> None:
    # Rename back to original names
    with op.batch_alter_table('workout_selections', schema=None) as batch_op:
        batch_op.alter_column('current_plan_day',
                              new_column_name='actual_date')
    
    with op.batch_alter_table('workouts', schema=None) as batch_op:
        batch_op.alter_column('originally_planned_day',
                              new_column_name='workout_day')
