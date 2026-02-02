"""add unique constraint on workout_selections workout_id

Revision ID: ffe812d426e2
Revises: c1ce1892f74b
Create Date: 2026-02-01 21:17:46.205799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffe812d426e2'
down_revision: Union[str, None] = 'c1ce1892f74b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add unique constraint on workout_selections.workout_id to prevent duplicate selections
    with op.batch_alter_table('workout_selections', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_workout_selections_workout_id', ['workout_id'])


def downgrade() -> None:
    # Remove the unique constraint
    with op.batch_alter_table('workout_selections', schema=None) as batch_op:
        batch_op.drop_constraint('uq_workout_selections_workout_id', type_='unique')
