# Workout Planner Backend

Flask API with SQLite for managing workout plans.

## Setup

### Create virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Initialize the database with Alembic
```bash
# Run database migrations to create tables
alembic upgrade head

# Import workout data from CSV
python import_csv.py
```

### Run the development server
```bash
python app.py
```

The API will run at `http://localhost:5000`

### Run tests
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

## Database Migrations with Alembic

This project uses [Alembic](https://alembic.sqlalchemy.org/) to manage database schema migrations.

### Quick Start with Helper Script

For convenience, use the `migrate.sh` helper script:

```bash
# Show all available commands
./migrate.sh

# Apply all pending migrations
./migrate.sh upgrade

# Check current migration version
./migrate.sh current

# View migration history
./migrate.sh history

# Create a new migration
./migrate.sh create "Add new column to workouts"

# Rollback one migration
./migrate.sh downgrade
```

### Common Alembic Commands

```bash
# Apply all pending migrations (run this after setup or pulling new code)
alembic upgrade head

# Check current migration version
alembic current

# View migration history
alembic history

# Create a new migration after modifying models.py
alembic revision --autogenerate -m "Description of changes"

# Downgrade to previous migration (rollback)
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>
```

### Creating a New Migration

When you modify the database models in `models.py`:

1. **Generate the migration**:
   ```bash
   alembic revision --autogenerate -m "Add new column to workouts"
   ```

2. **Review the generated migration** in `alembic/versions/` to ensure it captures your changes correctly

3. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```

4. **Test the changes** to ensure everything works

### Migration Files

- **alembic/versions/**: Contains all migration scripts
- **alembic.ini**: Alembic configuration file
- **alembic/env.py**: Migration environment setup (configured to work with Flask-SQLAlchemy)

### Notes

- The database schema is now managed by Alembic migrations, not by `db.create_all()`
- Always create a migration when modifying models
- Review auto-generated migrations before applying them
- Test migrations on development database before deploying to production

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

- SQLite database file: `workout_planner.db`
- Database schema managed by Alembic migrations
- Test database uses in-memory SQLite (`:memory:`)
- CORS enabled for React frontend during development
- Python 3.12+ recommended
