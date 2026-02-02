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

# Check if alembic_version table exists
echo "Checking migration state..."
python3 -c "
from sqlalchemy import create_engine, inspect
from config import Config
import sys

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
inspector = inspect(engine)

if 'alembic_version' not in inspector.get_table_names():
    print('⚠️  alembic_version table not found - database needs stamping')
    sys.exit(2)
else:
    print('✓ alembic_version table exists')
    sys.exit(0)
"

MIGRATION_CHECK=$?

if [ $MIGRATION_CHECK -eq 2 ]; then
    echo "📋 Database exists but not tracked by Alembic - stamping to current version..."
    alembic stamp head
    if [ $? -ne 0 ]; then
        echo "❌ Failed to stamp database!"
        exit 1
    fi
    echo "✅ Database stamped successfully"
else
    echo "Running pending migrations..."
    alembic upgrade head
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully"
    else
        echo "❌ Migrations failed! Not starting the application."
        exit 1
    fi
fi

# Start the application with gunicorn
echo ""
echo "🌐 Starting application server..."
echo "--------------------------------"
exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
    --workers 2 \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --preload \
    app:app
