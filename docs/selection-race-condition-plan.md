# Fix plan: Workout Selection race-condition & duplicate rows ⚠️

**Summary**

A race between multiple frontend PUT requests to the `/api/selections/<workout_id>` endpoint can create duplicate `workout_selections` rows when a selection does not yet exist. This happens when a single drag/drop results in two updates (date + time-of-day) being sent in parallel. The plan below covers prevention at the frontend, defensive backend changes, a unique constraint + migration, tests, and data cleanup steps for dev and production.

---

## Root cause

- `useCalendarDragDrop.handleDrop()` currently calls two separate callbacks when both the date and time slot change: `onWorkoutDateChange(id, newDate)` and `onWorkoutTimeOfDayChange(id, timeSlot)`. Each callback issues a `PUT /api/selections/<id>`.
- `update_selection()` on the server checks `selection = workout.selection` and if falsy creates `WorkoutSelection(workout_id=...)` and adds it. Two concurrent requests can both observe no selection and insert, producing duplicate rows even though the relationship is configured `uselist=False`.

---

## High-level approach (recommended)

1. Prevent duplicates at the source: batch related updates into a single PUT when possible (frontend change). ✅
2. Make backend defensive to handle concurrent updates safely (upsert / catch IntegrityError / re-apply updates inside transaction). ✅
3. Add a **unique constraint** on `workout_selections.workout_id` at the DB level via Alembic to prevent future duplicates. ✅
4. Add tests (unit, integration, concurrency test). ✅
5. Clean up existing duplicates in dev and production, then apply migration. ✅

> Note: Because you are the only user, you can temporarily stop using the app during the migration/cleanup window to avoid further writes.

---

## Specific code updates

### 1) Frontend: Batch date & time updates on drop (recommended)

- Change `useCalendarDragDrop.handleDrop()` (or wrapper in `Calendar`) to call a **single** handler when both date and time need changing.

Implementation (done) ✅

- `useCalendarDragDrop.handleDrop()` now requires and calls `onWorkoutSelectionUpdate(workoutId, updateFields)` with only the fields that changed (`currentPlanDay`, `timeOfDay`, or both).
- `Calendar` now accepts `onWorkoutSelectionUpdate` (marked required via PropTypes) and passes it to the hook.
- `App.js` implements `handleWorkoutSelectionUpdate(workoutId, updateFields)` which issues a single `PUT` to `API_ENDPOINTS.SELECTIONS(workoutId)` and updates local state.
- Files changed:
  - `app/src/hooks/useCalendarDragDrop.js` (hook logic changed and now enforces combined handler)
  - `app/src/components/Calendar.js` (prop wired and PropTypes updated)
  - `app/src/App.js` (new `handleWorkoutSelectionUpdate` and prop passed)
  - Tests: see `app/src/hooks/useCalendarDragDrop.test.js`, `app/src/components/Calendar.test.js`, `app/src/App.integration.test.js`.

Why: This reduces the chance of concurrent creation because one request will create the selection and set both fields; also simplifies frontend semantics (one handler, one request).

Suggested change in logic (example):

- Modify `handleDrop` to compute `needsDate` and `needsTime` and if both true call a new handler like `onWorkoutSelectionUpdate(id, { currentPlanDay: 'YYYY-MM-DD', timeOfDay: 'morning' })`.
- Update `App.js` to implement `handleWorkoutSelectionUpdate(workoutId, updateFields)` which does a single `PUT` to `API_ENDPOINTS.SELECTIONS(workoutId)` with combined fields.
- Keep existing smaller helpers (date-only or time-only) for other workflows, but prefer the combined call on drag-drop.

Why: This reduces the chance of concurrent creation because one request will create the selection and set both fields.

### 2) Backend: Defensive update + safe upsert

Update `update_selection()` (`backend/app.py`) to be robust against races:

- Option A (recommended for sqlite + postgres portability):
  - Start a transaction.
  - Attempt to get `selection = workout.selection`.
  - If not found, `selection = WorkoutSelection(workout_id=workout_id)` and `db.session.add(selection)`.
  - Apply updates, `db.session.flush()` and `db.session.commit()`.
  - If commit raises `IntegrityError` caused by `workout_id` unique constraint (when we add it), catch it, `db.session.rollback()`, re-query `selection = WorkoutSelection.query.filter_by(workout_id=workout_id).first()` and then apply requested updates to that selection and commit again.

- Option B (Postgres-only): Use `INSERT ... ON CONFLICT (workout_id) DO UPDATE SET ...` via raw SQL or SQLAlchemy `insert().on_conflict_do_update()` (requires SQLAlchemy extras).

Add logging to help spot race attempts.

### 3) Add unique constraint

- Add Alembic migration to alter the table and add a unique constraint/index on `workout_id`.

Example Alembic snippet (upgrade):

```py
op.create_unique_constraint('uq_workout_selections_workout_id', 'workout_selections', ['workout_id'])
```

And (downgrade):

```py
op.drop_constraint('uq_workout_selections_workout_id', 'workout_selections', type_='unique')
```

> Important: Migration will fail if duplicates currently exist. Deduplicate first or deploy the defensive backend change first (see recommended order below).

---

## Tests to add

### Frontend tests

- **Done:** Unit and integration tests were added to verify the batching behaviour and assert a single PUT is sent when date and/or time change on drop. Files added/updated:
  - `app/src/hooks/useCalendarDragDrop.test.js` — unit tests for the hook, asserting the combined `onWorkoutSelectionUpdate` is called with the expected fields.
  - `app/src/components/Calendar.test.js` — component-level tests verifying the combined handler is invoked (single call) for date, time, and combined drops.
  - `app/src/App.integration.test.js` — integration test asserting a single `PUT /api/selections/<id>` when the combined handler is used.

All frontend tests pass locally after the change (28 suites, all passing).

### Backend tests

- Unit test for `update_selection()` that:
  - Creates a `Workout` with no selection
  - Calls `update_selection()` twice in sequence (date-only then time-only) and asserts only one `WorkoutSelection` exists and fields updated correctly.

- Concurrency/resilience test:
  - Use two separate DB sessions (or use threaded requests) to simulate two concurrent requests that both attempt to create selection; assert only one row exists at the end and the final row contains combined updates.
  - If testing sqlite in-memory single-threaded runner is hard, use a functional integration test that calls the endpoint twice using the Flask test client in parallel (threading) and assert no duplicates created.

- Migration test
  - Create test fixture with duplicates, assert migration fails until dedupe is applied, and assert success after dedupe.

Add tests to `backend/test_app.py` and frontend tests in `app/src/components/` or `app/src/hooks/` tests.

---

## Data cleanup steps

### Development steps (local SQLite)

1. **Backup** (always):
   - Copy file: `cp backend/workout_planner.db backend/workout_planner.db.bak-$(date +%Y%m%d%H%M%S)`

2. **Find duplicates** (again):

```sql
SELECT workout_id, COUNT(*) AS cnt
FROM workout_selections
GROUP BY workout_id
HAVING COUNT(*) > 1;
```

3. **Dedupe (recommended: keep most recent `updated_at`)** — using a small Python snippet:

```py
import sqlite3
conn = sqlite3.connect('backend/workout_planner.db')
cur = conn.cursor()
cur.execute("SELECT workout_id FROM workout_selections GROUP BY workout_id HAVING COUNT(*) > 1;")
for (wid,) in cur.fetchall():
    cur.execute("SELECT id FROM workout_selections WHERE workout_id = ? ORDER BY datetime(updated_at) DESC", (wid,))
    ids = [r[0] for r in cur.fetchall()]
    keep = ids[0]
    remove = ids[1:]
    if remove:
        cur.executemany("DELETE FROM workout_selections WHERE id = ?", [(i,) for i in remove])
conn.commit()
conn.close()
```

4. Re-run duplicate check to ensure zero results.

5. Add a test that verifies dedupe logic (so future regressions can be detected).

### Production steps (Postgres or hosted DB)

1. **Backup DB** or create a dump before touching anything. Use your DB provider's snapshot or `pg_dump`.

2. **Identify duplicates**:

```sql
SELECT workout_id, COUNT(*) AS cnt
FROM workout_selections
GROUP BY workout_id
HAVING COUNT(*) > 1;
```

3. **Dedupe safely** (example using `updated_at` to keep latest):

For Postgres, a safe deletion using CTE:

```sql
WITH keep AS (
  SELECT DISTINCT ON (workout_id) id
  FROM workout_selections
  ORDER BY workout_id, updated_at DESC
)
DELETE FROM workout_selections s
WHERE s.id NOT IN (SELECT id FROM keep);
```

4. Verify results and run `SELECT workout_id, COUNT(*) FROM workout_selections GROUP BY workout_id HAVING COUNT(*) > 1;` — should return no rows.

5. Optionally, perform a short maintenance window (you can also ask users not to use the app during this time; single-user makes this trivial).

---

## Recommended order of steps (safe & minimal downtime)

1. **Add backend defensive changes & tests** (no migration yet): implement the `update_selection()` commit/catch/redo logic and add unit/concurrency tests. Deploy this first.
2. **Add frontend batching & tests**: update `handleDrop()` to send a single combined PUT for date+time drop; add frontend unit and integration tests. Deploy.
3. **Deduplicate production database**:
   - Take DB backup/snapshot.
   - Run dedupe script/SQL (keep latest `updated_at`).
   - Verify no duplicates remain.
4. **Add Alembic migration to add the unique constraint** and run migration on production. This will succeed because duplicates are cleaned.
5. **Add migration tests** and CI checks to ensure uniqueness is enforced.

Rationale: adding defensive code first avoids transient IntegrityErrors and ensures the system handles race paths before the database prevents them. Because you're the only user, you can also choose the simpler route: take the app offline, dedupe, apply migration and drop unique constraint and then deploy code changes — but the two-step approach above is safer and allows zero/minimal downtime.

---

## Quick operational checklist 🧭

- [x] Add backend defensive `update_selection()` changes + unit & concurrency tests
- [x] Add frontend batching on drop + frontend tests (implemented)
- [x] Add test to assert single PUT on combined changes (implemented)
- [x] Deduplicate dev DB and add cleanup script to repo (for manual re-runs) — added `scripts/dedupe_workout_selections.py`
  - Dev steps (recommended):
    1. Backup dev DB: `cp backend/workout_planner.db backend/workout_planner.db.bak-$(date +%Y%m%d%H%M%S)` ✅
    2. Run the dedupe script / SQL to remove existing duplicate `workout_selections` rows (keep most recent `updated_at`).
    3. Re-run the duplicate check SQL to ensure zero duplicates.
- [x] Add Alembic migration in development environment (unique constraint)
  - **When to run in development:** Run **only after** the following are completed and verified in dev: defensive backend changes are deployed and tests pass; frontend batching & tests are deployed and verified; and the dev DB has been deduplicated (see previous item).
  - **Local run steps:**
    1. Ensure you have a fresh backup of `backend/workout_planner.db`.
    2. Add the migration file (e.g., with `alembic revision --autogenerate -m "add unique constraint workout_selections.workout_id"`).
    3. Run migration locally: `alembic upgrade head` (or project-specific migration helper) against your dev DB.
    4. Run backend & integration tests to confirm the migration succeeds and there are no regressions.
    5. Commit the migration and include migration tests (migration should fail on a DB with duplicates).
- [x] Backup production DB and run dedupe there
- [x] Apply Alembic migration in production (only after production dedupe and a maintenance window if needed)
- [ ] Monitor logs for SAWarnings and IntegrityErrors for a few days

---

## Do you need to clean up data before making the code change?

- **Short answer:** Not strictly — you can implement defensive backend logic first and deploy it. But you **must** clean up duplicates before applying the unique-constraint migration, or the migration will fail.

- **If you want zero downtime and a fully safe rollout:**
  1. Deploy defensive backend change (handles races).
  2. Deploy frontend batching change (reduces occurrence of races).
  3. Run production dedupe.
  4. Apply the unique-constraint migration.

- **If you prefer a simple manual approach (single-user):**
  - Stop the app, run the dedupe on production, run migration, then deploy code changes. This is simplest because you control usage.

---

## Notes & extras
- Consider adding a simple `scripts/dedupe_workout_selections.py` script to the repo to allow safe repeated dedupe runs and to be used in CI for creating fixtures.
