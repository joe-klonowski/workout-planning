#!/bin/bash
# Production startup script for Railway deployment
# Runs database migrations before starting the application

set -e  # Exit immediately if any command fails

echo "🚀 Starting Workout Planner (Production)"
echo "========================================="

# Change to backend directory
cd /app/backend

# Check if DATABASE_URL is set (should be set by Railway)
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL not set. This should be set by Railway."
    echo "Proceeding anyway (might use SQLite fallback)..."
fi

# Run database migrations
echo ""
echo "📦 Running database migrations..."
echo "--------------------------------"

# Try to upgrade, and if it fails due to tables already existing, stamp instead
alembic upgrade head 2>&1 | tee /tmp/migration.log
# Capture the exit code of the alembic command (PIPESTATUS[0] holds the exit of the leftmost pipe)
alembic_exit=${PIPESTATUS[0]}

if grep -q "DuplicateTable\|relation .* already exists" /tmp/migration.log; then
    echo ""
    echo "⚠️  Tables already exist - stamping database to current version..."
    alembic stamp head
    
    if [ $? -eq 0 ]; then
        echo "✅ Database stamped to head successfully"
    else
        echo "❌ Failed to stamp database!"
        echo "---- Migration log ----"
        cat /tmp/migration.log
        echo "-----------------------"
        exit 1
    fi
elif [ $alembic_exit -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo ""
    echo "❌ Migrations failed! Not starting the application."
    echo ""
    echo "---- Migration log ----"
    cat /tmp/migration.log
    echo "-----------------------"
    # Helpful hint if unique constraint / duplicate key caused the failure
    if grep -q -i "duplicate key value\|unique constraint\|duplicate entry\|could not create unique index" /tmp/migration.log; then
        echo ""
        echo "⚠️  It looks like a unique-constraint migration failed (likely duplicates in production)."
        echo "Please deduplicate the 'workout_selections' table before re-deploying. See: docs/selection-race-condition-plan.md"
    fi
    exit 1
fi

# Start the application with gunicorn
echo ""
echo "🌐 Starting application server..."
echo "--------------------------------"
exec gunicorn --config gunicorn_config.py app:app
