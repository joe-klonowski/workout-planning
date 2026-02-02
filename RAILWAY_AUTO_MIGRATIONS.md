# Automatic Database Migrations on Railway

This document explains how automatic database migrations are configured for this Railway-deployed application.

## Overview

The application is configured to automatically run Alembic migrations before starting the server on each deployment. This ensures the production database schema stays in sync with the codebase.

## How It Works

### Production Startup Flow

1. **Railway triggers deployment** from GitHub main branch
2. **Docker builds** the application using [Dockerfile](Dockerfile)
3. **Startup script runs** ([backend/start-production.sh](backend/start-production.sh)):
   - Executes `alembic upgrade head` to apply pending migrations
   - If migrations succeed → starts gunicorn server
   - If migrations fail → exits with error code, deployment fails

### Key Files

#### [backend/start-production.sh](backend/start-production.sh)
The production startup script that:
- Runs database migrations first
- Only starts the app if migrations succeed
- Uses `set -e` to fail fast on any error

```bash
#!/bin/bash
set -e  # Exit immediately if any command fails

cd /app/backend
echo "📦 Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed! Not starting the application."
    exit 1
fi

echo "🌐 Starting application server..."
exec gunicorn --bind 0.0.0.0:${PORT:-5000} \
    --workers 2 \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --preload \
    app:app
```

#### [Dockerfile](Dockerfile)
Configures the container to use the startup script:
```dockerfile
# Make startup script executable
RUN chmod +x /app/backend/start-production.sh

# Run startup script (migrations + gunicorn)
CMD ["/app/backend/start-production.sh"]
```

#### [Procfile](Procfile)
Railway uses this to start the application:
```
web: cd backend && ./start-production.sh
```

## Deployment Workflow

### Automatic Deployment
1. Push code to GitHub main branch
2. Railway detects changes and starts deployment
3. Docker builds the image
4. Startup script runs migrations automatically
5. If migrations succeed, server starts
6. If migrations fail, deployment fails (old version keeps running)

### Manual Migration Check
To check migration status in Railway:

1. Open Railway dashboard
2. Go to your service
3. Click "Deployments" → Latest deployment
4. View logs to see migration output

## Safety Features

### Migration Failure Protection
- **Fail-fast**: If migrations fail, the app won't start
- **Old version stays running**: Railway keeps the previous deployment running if the new one fails
- **Error visibility**: Migration errors appear in deployment logs

### Database Connection
- Uses `DATABASE_URL` environment variable (automatically set by Railway)
- Alembic configuration in [backend/alembic/env.py](backend/alembic/env.py) reads from Flask config
- Supports both PostgreSQL (production) and SQLite (development)

## Creating New Migrations

### Local Development
1. Make changes to [backend/models.py](backend/models.py)
2. Generate migration:
   ```bash
   cd backend
   alembic revision --autogenerate -m "describe your changes"
   ```
3. Review the generated migration in `backend/alembic/versions/`
4. Test locally:
   ```bash
   alembic upgrade head
   ```
5. Commit and push to trigger automatic deployment

### Testing Before Production
- Always test migrations locally first
- Run `./test-backend.sh` to ensure tests pass
- Consider the migration order in [docs/selection-race-condition-plan.md](docs/selection-race-condition-plan.md)

## Current Migration Status

### Pending Migration
There is currently a pending migration to add a unique constraint on `workout_selections.workout_id`:
- **File**: `ffe812d426e2_add_unique_constraint_on_workout_.py`
- **Purpose**: Prevent duplicate workout selections (race condition fix)
- **Pre-requisite**: Database must be deduplicated first (see below)

### Pre-Deployment Checklist for Unique Constraint Migration

⚠️ **Important**: This migration will fail if duplicate `workout_selections` exist.

Before deploying this migration to production:

1. **Backup the production database**
   - Railway provides automatic backups
   - Can also create manual snapshot in Railway dashboard

2. **Check for duplicates** (via Railway database query):
   ```sql
   SELECT workout_id, COUNT(*) AS cnt
   FROM workout_selections
   GROUP BY workout_id
   HAVING COUNT(*) > 1;
   ```

3. **Deduplicate if needed** (keep most recent):
   ```sql
   WITH keep AS (
     SELECT DISTINCT ON (workout_id) id
     FROM workout_selections
     ORDER BY workout_id, updated_at DESC
   )
   DELETE FROM workout_selections s
   WHERE s.id NOT IN (SELECT id FROM keep);
   ```

4. **Verify deduplication**:
   ```sql
   SELECT workout_id, COUNT(*) AS cnt
   FROM workout_selections
   GROUP BY workout_id
   HAVING COUNT(*) > 1;
   -- Should return no rows
   ```

5. **Deploy** - push to main branch and Railway will:
   - Run the migration automatically
   - Add the unique constraint
   - Start the application

See [docs/selection-race-condition-plan.md](docs/selection-race-condition-plan.md) for complete context.

## Rollback Procedure

If a deployment with migrations fails:

### Option 1: Railway Automatic Rollback
- Railway keeps the previous deployment running
- Simply redeploy a working commit or fix the issue

### Option 2: Manual Database Rollback
If you need to rollback the database schema:

1. Connect to Railway database (via Railway CLI or psql)
2. Run downgrade command manually:
   ```bash
   cd backend
   alembic downgrade -1  # Rollback one migration
   ```

### Option 3: Rollback via Railway Shell
```bash
railway run bash
cd backend
alembic downgrade -1
```

## Troubleshooting

### Migration Fails on Deployment
1. Check Railway deployment logs for error message
2. Test migration locally:
   ```bash
   cd backend
   alembic upgrade head
   ```
3. Fix the issue and redeploy

### "Database URL not set" Warning
- Ensure `DATABASE_URL` is configured in Railway environment variables
- Should be automatically set by Railway when database is added

### "Migration already applied"
- This is safe - Alembic tracks which migrations are applied
- The command will do nothing if already up to date

### Connection Errors
- Check Railway database is running
- Verify DATABASE_URL includes `?sslmode=require` (handled by [backend/config.py](backend/config.py))

## Local Development vs Production

### Local (SQLite)
```bash
cd backend
source venv/bin/activate
alembic upgrade head  # Apply migrations
python app.py         # Start server
```

### Production (Railway + PostgreSQL)
- Migrations run automatically on every deployment
- No manual intervention needed (unless deduplication required)
- Monitor via Railway deployment logs

## Additional Resources

- [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md)
- [Railway Quick Reference](RAILWAY_QUICK_REF.md)
- [Selection Race Condition Fix Plan](docs/selection-race-condition-plan.md)
- [Alembic Documentation](backend/alembic/README.md)
