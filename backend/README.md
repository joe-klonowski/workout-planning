# Workout Planner Backend

Flask API with SQLite for managing workout plans.

## Setup

### 1. Create virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the development server
```bash
python app.py
```

The API will run at `http://localhost:5000`

### 4. Run tests
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=. --cov-report=html

# Run specific test file
pytest test_app.py

# Run specific test
pytest test_app.py::test_health_check
```

View coverage report by opening `htmlcov/index.html` in a browser

## API Endpoints

### Workouts
- `GET /api/workouts` - Get all workouts with selections
- `GET /api/workouts/<id>` - Get specific workout
- `POST /api/workouts/import` - Import workouts from CSV

### Workout Selections
- `PUT /api/selections/<workout_id>` - Update workout selection (mark selected/skipped, move date, etc.)
- `DELETE /api/selections/<workout_id>` - Delete selection (reset to defaults)

### Custom Workouts
- `GET /api/custom-workouts` - Get all custom workouts
- `POST /api/custom-workouts` - Create custom workout
- `PUT /api/custom-workouts/<id>` - Update custom workout
- `DELETE /api/custom-workouts/<id>` - Delete custom workout

### Utilities
- `GET /api/health` - Health check
- `GET /api/stats` - Get workout statistics

## Database Schema

### `workouts` table
Stores original workouts imported from TrainingPeaks CSV (immutable)

### `workout_selections` table
Stores user modifications (selected/skipped, date moved, time of day)

### `custom_workouts` table
Stores user-created workouts (group rides, custom training, etc.)

## Import CSV Example

```bash
curl -X POST http://localhost:5000/api/workouts/import \
  -F "file=@../inputs/workouts.csv"
```

Or from the React app:
```javascript
const formData = new FormData();
formData.append('file', csvFile);

fetch('http://localhost:5000/api/workouts/import', {
  method: 'POST',
  body: formData
});
```

## Update Selection Example

```bash
curl -X PUT http://localhost:5000/api/selections/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isSelected": true,
    "actualDate": "2026-01-15",
    "timeOfDay": "morning"
  }'
```

## Testing

The backend includes comprehensive test coverage for:
- **Model tests**: Workout, WorkoutSelection, CustomWorkout models
- **API endpoint tests**: All REST endpoints with various scenarios
- **Data validation**: CSV import, duplicate handling, relationships
- **Error handling**: 404s, invalid data, edge cases

Test coverage includes:
- Health check endpoint
- Workout CRUD operations
- CSV import (both direct and file upload)
- Workout selections (create, update, delete)
- Custom workouts (full CRUD)
- Statistics endpoint
- Model relationships

Run `pytest --cov` to see current test coverage percentage.

## Development Notes

- SQLite database file: `workout_planner.db` (auto-created on first run)
- Test database uses in-memory SQLite (`:memory:`)
- Database tables are created automatically on app startup
- CORS enabled for React frontend during development
- Python 3.12+ recommended
