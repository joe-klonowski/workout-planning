import pytest
from datetime import date, datetime, timedelta, timezone
from app import create_app
from models import db, Workout, WorkoutSelection
from dedupe_workout_selections import dedupe


@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_dedupe_merges_and_removes_duplicates(app):
    with app.app_context():
        # Create a workout
        w = Workout(
            title='Dedupe Test',
            workout_type='Bike',
            originally_planned_day=date(2026, 1, 10)
        )
        db.session.add(w)
        db.session.commit()

        # Create two selection rows with same workout_id
        older = WorkoutSelection(
            workout_id=w.id,
            is_selected=False,
            time_of_day='evening',
            user_notes='older note'
        )
        # Ensure older has earlier updated_at
        older.updated_at = datetime.now(timezone.utc) - timedelta(days=1)
        db.session.add(older)

        newer = WorkoutSelection(
            workout_id=w.id,
            is_selected=True,
            # newer has time_of_day None so it should be merged from older
            time_of_day=None,
            user_notes=None
        )
        # newer has later updated_at
        newer.updated_at = datetime.now(timezone.utc)
        db.session.add(newer)

        db.session.commit()

        # Verify duplicates exist
        selections = WorkoutSelection.query.filter_by(workout_id=w.id).all()
        assert len(selections) == 2

        # Run dedupe
        num_workouts, deleted = dedupe(db.session, commit=True, dry_run=False, verbose=False)

        assert num_workouts == 1
        assert deleted == 1

        selections = WorkoutSelection.query.filter_by(workout_id=w.id).all()
        assert len(selections) == 1
        sel = selections[0]
        # Keeper should be the newer row and should have time_of_day merged from older row
        assert sel.is_selected is True
        assert sel.time_of_day == 'evening'
        # user_notes should be preserved if keeper None and older had value
        assert sel.user_notes == 'older note'
