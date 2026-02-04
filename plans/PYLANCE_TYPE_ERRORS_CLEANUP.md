# Plan: Clean Up Pylance/Pyright Type Errors

## Overview
This plan addresses pylance/pyright type checking errors in the backend Python code, focusing on:
1. Removing unnecessary `# type: ignore` comments (6 instances in app.py)
2. Fixing SQLAlchemy type inference issues
3. Ensuring proper type hints throughout the codebase

## Progress Checklist

### Core Fixes (Phases 1-7)
- [ ] **Phase 1**: Install Type Stubs (Very Low Risk, 5-10 min)
- [ ] **Phase 2**: Add Pyright Configuration (Low Risk, 10-15 min)
- [ ] **Phase 3**: Fix SQLAlchemy Column Ordering (Medium Risk, 10-15 min)
- [ ] **Phase 4**: Fix Relationship Attribute Assignment (Medium Risk, 15-20 min)
- [ ] **Phase 5**: Fix Optional to_dict() Call (Low Risk, 5-10 min)
- [ ] **Phase 6**: Fix SQLAlchemy Filter Comparisons (Medium Risk, 10-15 min)
- [ ] **Phase 7**: Validate Full Test Suite (Critical, 5-10 min)

### Long-term Measures (Phases 8-9)
- [ ] **Phase 8**: Update AGENTS.md with Linting Guidelines (Low Risk, 10-15 min)
- [ ] **Phase 9**: Add Pre-commit Hook for Type Error Regression (Medium Risk, 30-45 min)

### Final Validation
- [ ] All tests passing (`./test-all.sh`)
- [ ] No new pylance errors in VS Code
- [ ] Test coverage maintained or improved
- [ ] Error baseline established (if Phase 9 complete)
- [ ] Documentation updated

---

## Current Issues Summary

### Type Ignore Comments
- 6 `# type: ignore` comments in app.py (lines 4, 5, 6, 17, 21, 77)
- All are on import statements for Flask, Flask-CORS, config, and SQLAlchemy

### Active Type Errors in app.py
1. **Line 282**: SQLAlchemy `order_by()` not recognizing Column type
2. **Lines 395, 397**: Cannot assign to `selection.time_of_day` and `selection.workout_location` (relationship property confusion)
3. **Line 579**: `.to_dict()` method not recognized (Optional type handling)
4. **Lines 865-866**: SQLAlchemy comparison operations not recognized as valid filter arguments

## Root Causes

### 1. Missing Type Stubs for Third-Party Libraries
Flask, Flask-SQLAlchemy, and related packages lack proper type stubs. This is causing false positives on imports.

**Solution**: Install type stub packages:
- `types-Flask`
- `types-requests`
- `types-Werkzeug`

### 2. SQLAlchemy Type Inference Issues
SQLAlchemy's dynamic ORM patterns confuse static type checkers. The `db.Column`, `db.relationship`, and query operations have complex typing.

**Solution**: 
- Add SQLAlchemy plugin configuration for pyright/pylance
- Use explicit type annotations on model attributes when needed
- Consider using SQLAlchemy 2.0 style typing with `Mapped[]` annotations (future enhancement)

### 3. Relationship vs Instance Attributes
The type checker sees `workout.selection` as a `RelationshipProperty` at class level but doesn't understand it becomes a `WorkoutSelection` instance at runtime.

**Solution**: Use proper type annotations or runtime checks to help the type checker understand the actual types.

## Phased Cleanup Plan

### Phase 1: Install Type Stubs (Low Risk)
**Goal**: Eliminate false positives on library imports
**Time Estimate**: 5-10 minutes
**Risk**: Very Low

1. Add type stub packages to `requirements.txt`:
   ```
   types-Flask>=1.1.0
   types-requests>=2.31.0
   types-Werkzeug>=1.0.0
   ```

2. Install packages:
   ```bash
   cd backend
   pip install types-Flask types-requests types-Werkzeug
   ```

3. Remove the 6 `# type: ignore` comments from imports in app.py

4. Verify no new errors appear

**Success Criteria**: No errors on import statements

**Rollback**: If errors appear, keep the type stubs but restore the ignore comments temporarily

---

### Phase 2: Add Pyright Configuration (Low Risk)
**Goal**: Configure pylance/pyright to work better with SQLAlchemy
**Time Estimate**: 10-15 minutes
**Risk**: Low

1. Create `backend/pyrightconfig.json`:
   ```json
   {
     "include": [
       "."
     ],
     "exclude": [
       "**/node_modules",
       "**/__pycache__",
       ".venv",
       "venv",
       "alembic"
     ],
     "reportMissingImports": true,
     "reportMissingTypeStubs": false,
     "pythonVersion": "3.11",
     "pythonPlatform": "Linux",
     "typeCheckingMode": "basic",
     "useLibraryCodeForTypes": true
   }
   ```

2. Test that pylance respects the config

3. Gradually increase `typeCheckingMode` from "basic" to "standard" if desired

**Success Criteria**: Config file loads without errors

**Rollback**: Delete the config file

---

### Phase 3: Fix SQLAlchemy Column Ordering (Medium Risk)
**Goal**: Fix the `order_by()` type error on line 282
**Time Estimate**: 10-15 minutes
**Risk**: Medium (runtime behavior should be identical but need to verify)

1. The error is that pylance doesn't recognize `Workout.originally_planned_day` as a Column at query time

2. **Option A** (Recommended - Type Cast):
   ```python
   from sqlalchemy import cast
   from typing import TYPE_CHECKING
   
   if TYPE_CHECKING:
       from sqlalchemy import Column
   
   # At line 282:
   workouts = Workout.query.order_by(Workout.originally_planned_day).all()  # type: ignore[arg-type]
   ```
   Add a more specific ignore comment explaining the SQLAlchemy typing limitation.

3. **Option B** (Use SQLAlchemy 2.0 style):
   This is more invasive and should be saved for a future refactor.

4. Run tests:
   ```bash
   ./test-backend.sh tests/test_app.py::test_get_workouts
   ```

**Success Criteria**: Tests pass, error is suppressed with explanation

**Rollback**: Revert changes if tests fail

---

### Phase 4: Fix Relationship Attribute Assignment (Medium Risk)
**Goal**: Fix lines 395, 397 where `selection.time_of_day` and `selection.workout_location` show errors
**Time Estimate**: 15-20 minutes
**Risk**: Medium

The issue is that `workout.selection` is typed as `RelationshipProperty[Any]` at class level but is actually a `WorkoutSelection | None` instance at runtime.

**Solution**:
1. Check if selection exists before assignment (already done)
2. Add type assertion to help pylance:

   ```python
   # Around line 388-397:
   if 'timeOfDay' in data or 'workoutLocation' in data:
       selection = workout.selection
       if not selection:
           selection = WorkoutSelection(workout_id=workout.id, is_selected=True)
           db.session.add(selection)
       
       # Type assertion for pylance
       assert isinstance(selection, WorkoutSelection)
       
       if 'timeOfDay' in data:
           selection.time_of_day = data['timeOfDay']
       if 'workoutLocation' in data:
           selection.workout_location = data['workoutLocation']
   ```

3. Run tests:
   ```bash
   ./test-backend.sh tests/test_app.py -k "update_workout"
   ```

**Success Criteria**: Tests pass, no type errors on those lines

**Rollback**: Remove assertions if they cause issues

---

### Phase 5: Fix Optional to_dict() Call (Low Risk)
**Goal**: Fix line 579 where `.to_dict()` is called on potentially None selection
**Time Estimate**: 5-10 minutes
**Risk**: Low

The code already handles the creation of a selection if it doesn't exist, but pylance doesn't track that through the commit/query cycle.

**Solution**:
```python
# Around line 578:
selection = WorkoutSelection.query.filter_by(workout_id=workout_id).first()

# Add assertion to help type checker
assert selection is not None, "Selection should exist after creation"

return jsonify(selection.to_dict()), 200
```

Alternative (more defensive):
```python
selection = WorkoutSelection.query.filter_by(workout_id=workout_id).first()
if not selection:
    return jsonify({'error': 'Failed to create or retrieve selection'}), 500

return jsonify(selection.to_dict()), 200
```

Run tests:
```bash
./test-backend.sh tests/test_app.py::test_get_selection
```

**Success Criteria**: Tests pass, no type error

**Rollback**: Revert if tests fail

---

### Phase 6: Fix SQLAlchemy Filter Comparisons (Medium Risk)
**Goal**: Fix lines 865-866 where date comparisons in filters show type errors
**Time Estimate**: 10-15 minutes
**Risk**: Medium

Similar to Phase 3, this is a SQLAlchemy typing limitation.

**Solution**:
```python
# Around line 864:
# Get workouts in the date range
workouts = Workout.query.filter(
    Workout.originally_planned_day >= start_date,  # type: ignore[arg-type]
    Workout.originally_planned_day <= end_date  # type: ignore[arg-type]
).all()
```

Add a comment above explaining:
```python
# Note: SQLAlchemy column comparisons are not fully typed
# These comparisons are valid at runtime despite type checker warnings
```

Run tests:
```bash
./test-backend.sh tests/test_caldav_integration.py
```

**Success Criteria**: Tests pass, errors suppressed with explanation

**Rollback**: Remove ignore comments if they mask real issues

---

## Phase 7: Validate Full Test Suite (Critical)
**Goal**: Ensure all changes work together
**Time Estimate**: 5-10 minutes
**Risk**: Low (just validation)

1. Run full backend test suite:
   ```bash
   ./test-backend.sh
   ```

2. Check test coverage hasn't decreased:
   ```bash
   ./test-backend.sh --cov=. --cov-report=term-missing
   ```

3. Verify no new pylance errors appear in VSCode

**Success Criteria**: All tests pass, coverage maintained or improved

**Rollback**: Revert all phases if tests fail

---

## Agent Execution Guidelines

### How to Avoid Getting Stuck

1. **Execute phases sequentially** - Don't skip ahead
2. **Run tests after each phase** - Catch issues early
3. **Commit after each successful phase** - Create rollback points
4. **If a phase fails**: 
   - Try the rollback procedure
   - Document the issue
   - Move to the next phase if the current issue isn't blocking
5. **Read error messages carefully** - Pylance errors often suggest the fix
6. **Don't fight the type checker** - If SQLAlchemy typing is truly broken, use `# type: ignore` with a clear explanation comment

### Testing Strategy

- Phase 1: No tests needed (just package installation)
- Phase 2: No tests needed (config only)
- Phases 3-6: Run specific tests for the code being modified
- Phase 7: Full test suite

### Expected Timeline

- **Phases 1-7 (Core fixes)**: 1-2 hours
- **Phase 8 (Documentation)**: 10-15 minutes
- **Phase 9 (Pre-commit hook)**: 30-45 minutes
- **Total time**: 2-3 hours
- **Blocking risk**: Low (each phase is independent)
- **Success probability**: High (mostly type stub installation and targeted fixes)

### If Agent Gets Stuck

Common issues and solutions:

1. **Type stubs not found**: Check PyPI for correct package names
2. **SQLAlchemy errors persist**: Use targeted `# type: ignore[arg-type]` with explanation
3. **Tests fail**: Check if the behavior changed (likely not, just typing)
4. **Pylance still shows errors**: Restart VS Code Python language server

## Phase 8: Update AGENTS.md with Linting Guidelines (Low Risk)
**Goal**: Document expectations for AI agents to check and fix type errors
**Time Estimate**: 10-15 minutes
**Risk**: Very Low (documentation only)

Add a new section to AGENTS.md about type checking and linting:

```markdown
## Type Checking and Linting

### Pyright/Pylance
- Always check for pyright/pylance errors before completing work
- Fix type errors rather than suppressing them with `# type: ignore` when possible
- If `# type: ignore` is necessary (e.g., SQLAlchemy ORM limitations), add a comment explaining why:
  ```python
  # type: ignore[arg-type]  # SQLAlchemy column comparisons aren't fully typed
  ```
- Run `pylance` check in VS Code or use `pyright` CLI if available

### When to check
- After writing new code
- After modifying existing code
- Before marking tasks as complete
- As part of pre-commit checks

### Common patterns
- Missing type stubs: Install `types-*` packages
- SQLAlchemy ORM: May require targeted `# type: ignore[arg-type]` with explanation
- Optional values: Use proper None checks or assertions
- Import errors: Verify packages are installed and type stubs available
```

**Success Criteria**: AGENTS.md updated with clear guidance

---

## Phase 9: Add Pre-commit Hook for Type Error Regression (Medium Risk)
**Goal**: Prevent type errors from increasing over time
**Time Estimate**: 30-45 minutes
**Risk**: Medium (requires testing the hook)

Create a pre-commit hook that ensures type errors don't increase.

### Step 1: Create the Error Counting Script

Create `scripts/count-type-errors.sh`:
```bash
#!/bin/bash
# Count pyright errors in backend code

cd backend

# Check if pyright is available
if ! command -v pyright &> /dev/null; then
    echo "Warning: pyright not installed. Install with: npm install -g pyright"
    echo "Skipping type check..."
    exit 0
fi

# Run pyright and count errors
# Use --outputjson for parseable output
OUTPUT=$(pyright --outputjson 2>&1)

# Extract error count from JSON
ERROR_COUNT=$(echo "$OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['summary']['errorCount'])
except:
    print('0')
")

echo "$ERROR_COUNT"
```

### Step 2: Create the Pre-commit Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Pre-commit hook to prevent type error regression

# File to store the baseline error count
BASELINE_FILE=".pyright-error-baseline"

# Get current error count
CURRENT_ERRORS=$(./scripts/count-type-errors.sh)

# If pyright isn't available, skip check
if [ -z "$CURRENT_ERRORS" ]; then
    exit 0
fi

echo "Current type errors: $CURRENT_ERRORS"

# If baseline doesn't exist, create it
if [ ! -f "$BASELINE_FILE" ]; then
    echo "$CURRENT_ERRORS" > "$BASELINE_FILE"
    echo "Created baseline with $CURRENT_ERRORS errors"
    exit 0
fi

# Read baseline
BASELINE_ERRORS=$(cat "$BASELINE_FILE")
echo "Baseline type errors: $BASELINE_ERRORS"

# Check if errors increased
if [ "$CURRENT_ERRORS" -gt "$BASELINE_ERRORS" ]; then
    echo ""
    echo "❌ Type error regression detected!"
    echo "   Baseline: $BASELINE_ERRORS errors"
    echo "   Current:  $CURRENT_ERRORS errors"
    echo "   Increase: $((CURRENT_ERRORS - BASELINE_ERRORS)) errors"
    echo ""
    echo "Please fix the new type errors before committing."
    echo "Run 'pyright' in the backend directory to see details."
    echo ""
    echo "To skip this check: git commit --no-verify"
    exit 1
fi

# If errors decreased, update baseline
if [ "$CURRENT_ERRORS" -lt "$BASELINE_ERRORS" ]; then
    echo "$CURRENT_ERRORS" > "$BASELINE_FILE"
    echo "✅ Type errors decreased! Updated baseline to $CURRENT_ERRORS"
fi

exit 0
```

### Step 3: Make Scripts Executable

```bash
chmod +x scripts/count-type-errors.sh
chmod +x .git/hooks/pre-commit
```

### Step 4: Initialize Baseline

```bash
./scripts/count-type-errors.sh > .pyright-error-baseline
git add .pyright-error-baseline
```

### Step 5: Update .gitignore

Add to `.gitignore` if not already present:
```
# Allow baseline to be tracked
!.pyright-error-baseline
```

### Step 6: Document in README

Add to backend/README.md:
```markdown
## Type Checking

This project uses pyright for static type checking. A pre-commit hook prevents
type errors from increasing.

### Install pyright (optional but recommended)
```bash
npm install -g pyright
```

### Check types manually
```bash
cd backend
pyright
```

### Current error baseline
The `.pyright-error-baseline` file tracks the acceptable number of type errors.
This number should trend downward over time as we fix issues.

### Pre-commit hook
The hook will:
- ✅ Allow commits if errors stay the same or decrease
- ❌ Block commits if errors increase
- Auto-update baseline when errors decrease
- Skip check if pyright isn't installed

To bypass (not recommended):
```bash
git commit --no-verify
```
```

### Step 7: Test the Hook

```bash
# Test that it allows commits with no regression
git add -A
git commit -m "Test commit"

# Manually test regression detection by temporarily increasing baseline
echo "0" > .pyright-error-baseline
git commit -m "Test" # Should fail
git restore .pyright-error-baseline
```

**Success Criteria**: 
- Hook blocks commits when errors increase
- Hook allows commits when errors stay the same or decrease
- Hook updates baseline when errors decrease
- Documentation is clear

**Rollback**: Remove the pre-commit hook file

---

## Future Enhancements

After this cleanup is complete, consider:

1. **Upgrade to SQLAlchemy 2.0 syntax** with `Mapped[]` type annotations for better type checking
2. **Add mypy to CI/CD** to catch type errors automatically (in addition to pyright)
3. **Create type stubs for custom modules** if needed
4. **Document typing patterns** in the project README
5. **Add pyright to CI/CD pipeline** to enforce the error baseline across all commits
6. **Gradually reduce baseline to zero** by fixing errors over time

## Success Metrics

- ✅ Zero `# type: ignore` comments without explanation
- ✅ All import-related type errors resolved
- ✅ SQLAlchemy errors properly suppressed with explanations
- ✅ All tests passing
- ✅ No new runtime errors introduced
- ✅ Test coverage maintained or improved
- ✅ AGENTS.md updated with type checking guidelines
- ✅ Pre-commit hook preventing error regression
- ✅ Error baseline established and documented

## Notes

- The `# type: ignore` comments on imports are false positives from missing type stubs
- SQLAlchemy's ORM typing is inherently challenging for static analysis
- Some `# type: ignore[arg-type]` comments on SQLAlchemy operations are acceptable with proper documentation
- The goal is not 100% type purity but rather removing noise and catching real type errors
