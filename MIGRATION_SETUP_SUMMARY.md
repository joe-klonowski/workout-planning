# Quick Setup Summary: Automatic Database Migrations

## What Was Set Up

✅ **Automatic migrations on every Railway deployment**
- Migrations run before app starts
- App only starts if migrations succeed
- Zero-downtime deployment with safety checks

## Files Created/Modified

### Created
- [backend/start-production.sh](backend/start-production.sh) - Startup script that runs migrations then starts server
- [RAILWAY_AUTO_MIGRATIONS.md](RAILWAY_AUTO_MIGRATIONS.md) - Complete documentation
- [check-migration-ready.sh](check-migration-ready.sh) - Pre-deployment verification script

### Modified
- [Dockerfile](Dockerfile) - Uses startup script as CMD
- [Procfile](Procfile) - Railway uses startup script

## How It Works

```
Push to GitHub main
    ↓
Railway detects change
    ↓
Builds Docker image
    ↓
Runs: start-production.sh
    ├─→ alembic upgrade head
    │   ├─ Success → Start gunicorn ✅
    │   └─ Failure → Exit (deployment fails) ❌
    └─→ App starts serving requests
```

## Current Status

⚠️ **Pending Migration**: Unique constraint on `workout_selections.workout_id`

### Before First Deploy with This Setup

You MUST prepare the production database first (see [selection-race-condition-plan.md](docs/selection-race-condition-plan.md)):

1. **Backup database** (Railway dashboard)
2. **Check for duplicates**:
   ```sql
   SELECT workout_id, COUNT(*) FROM workout_selections 
   GROUP BY workout_id HAVING COUNT(*) > 1;
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
4. **Verify zero duplicates**
5. **Deploy** (push to main)

## Verification

Run the checklist script:
```bash
./check-migration-ready.sh
```

## Deployment

```bash
git add -A
git commit -m "Add automatic migrations with unique constraint"
git push origin main
```

Monitor in Railway dashboard → Deployments → View logs
Look for: `✅ Migrations completed successfully`

## Safety Features

- **Fail-fast**: Failed migrations prevent app startup
- **Old version keeps running**: Railway doesn't switch to new deployment if it fails
- **Visible errors**: All migration output in deployment logs
- **No manual steps**: Fully automatic on every deployment

## Testing Locally

```bash
cd backend
source venv/bin/activate
alembic upgrade head  # Test migration
python app.py         # Start server
```

## For Future Migrations

1. Edit [backend/models.py](backend/models.py)
2. Generate migration:
   ```bash
   cd backend
   alembic revision --autogenerate -m "description"
   ```
3. Test locally: `alembic upgrade head`
4. Commit and push → Automatic deployment with migration

## Documentation

- **Complete guide**: [RAILWAY_AUTO_MIGRATIONS.md](RAILWAY_AUTO_MIGRATIONS.md)
- **Context**: [docs/selection-race-condition-plan.md](docs/selection-race-condition-plan.md)
- **Alembic docs**: [backend/alembic/README.md](backend/alembic/README.md)

---

**Next Step**: Deduplicate production database, then deploy to enable automatic migrations.
