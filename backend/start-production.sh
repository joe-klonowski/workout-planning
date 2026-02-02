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
alembic upgrade head

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed! Not starting the application."
    exit 1
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
