"""Backend helper for deduplicating workout_selections using SQLAlchemy session.
This module exposes `dedupe(session, commit=True, dry_run=False, verbose=False)`
so tests can call it directly.
"""
from datetime import datetime
from sqlalchemy import func
from models import WorkoutSelection


def dedupe(session, commit=True, dry_run=False, verbose=False):
    totals_deleted = 0
    dup_rows = session.query(WorkoutSelection.workout_id, func.count(WorkoutSelection.id).label('cnt')) \
        .group_by(WorkoutSelection.workout_id) \
        .having(func.count(WorkoutSelection.id) > 1) \
        .all()

    if not dup_rows:
        if verbose:
            print("No duplicates found.")
        return 0, 0

    if verbose:
        print(f"Found {len(dup_rows)} workouts with duplicate selections")

    for workout_id, cnt in dup_rows:
        selections = session.query(WorkoutSelection) \
            .filter_by(workout_id=workout_id) \
            .order_by(WorkoutSelection.updated_at.desc()) \
            .all()
        keeper = selections[0]
        others = selections[1:]

        if verbose:
            print(f"Processing workout_id={workout_id}: keeping id={keeper.id}, removing {len(others)} duplicates")

        for other in others:
            for attr in ('is_selected', 'current_plan_day', 'time_of_day', 'workout_location', 'user_notes'):
                other_val = getattr(other, attr)
                if getattr(keeper, attr) is None and other_val is not None:
                    if verbose:
                        print(f"  Merging field {attr}: {other_val} into keeper id={keeper.id}")
                    setattr(keeper, attr, other_val)
            if dry_run:
                if verbose:
                    print(f"  (dry-run) Would delete selection id={other.id}")
            else:
                session.delete(other)
                totals_deleted += 1

    if dry_run:
        if verbose:
            print("Dry run complete; no changes committed.")
        return len(dup_rows), 0

    if commit:
        session.commit()
        if verbose:
            print(f"Committed changes; deleted {totals_deleted} duplicate rows")

    return len(dup_rows), totals_deleted
