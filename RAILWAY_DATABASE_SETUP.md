# PostgreSQL Database Setup on Railway

This guide helps you set up and troubleshoot the PostgreSQL database on Railway.

## Step 1: Check Database Connection

Run the diagnostic script to see the current state:

```bash
# Using Railway CLI
railway run python backend/check_db.py

# Or in Railway Shell (via dashboard)
cd backend && python check_db.py
```

This will show you:
- Whether the DATABASE_URL is set
- If the database connection works
- What tables exist
- How many users are in the database
- How many workouts are loaded

## Step 2: Run Database Migrations

If tables are missing or need to be updated:

```bash
# Using Railway CLI
railway run bash -c "cd backend && alembic upgrade head"

# Or in Railway Shell
cd backend && alembic upgrade head
```

This will create all necessary database tables based on your models.

## Step 3: Create a User Account

If no users exist:

```bash
# Using Railway CLI
railway run python backend/create_user.py YOUR_USERNAME YOUR_PASSWORD

# Or in Railway Shell
cd backend && python create_user.py YOUR_USERNAME YOUR_PASSWORD
```

Replace YOUR_USERNAME and YOUR_PASSWORD with your actual credentials.

## Step 4: Import Workouts (Optional)

If you want to import workouts from a CSV file:

```bash
# First, make sure you have a workouts CSV file
# Then run:
railway run python backend/import_csv.py path/to/workouts.csv

# Or in Railway Shell
cd backend && python import_csv.py ../inputs/workouts.csv
```

## Troubleshooting

### Check if DATABASE_URL is set

In Railway dashboard:
1. Go to your backend service
2. Click "Variables" tab
3. Look for `DATABASE_URL` - it should be set automatically when you connect the PostgreSQL service

If it's not set:
1. Go to your PostgreSQL service
2. Click "Connect"
3. Copy the connection string
4. Add it as `DATABASE_URL` variable to your backend service

### Check PostgreSQL Service is Running

In Railway dashboard:
1. Go to your PostgreSQL service
2. Check that it's deployed and running
3. Check the "Deployments" tab for any errors

### Reset Database (DANGER: Deletes all data!)

If you need to start fresh:

```bash
# Drop all tables
railway run bash -c "cd backend && alembic downgrade base"

# Recreate tables
railway run bash -c "cd backend && alembic upgrade head"

# Recreate user
railway run python backend/create_user.py YOUR_USERNAME YOUR_PASSWORD
```

## Quick Verification Commands

### Check current migration version
```bash
railway run bash -c "cd backend && alembic current"
```

### List all migrations
```bash
railway run bash -c "cd backend && alembic history"
```

### Test database connection
```bash
railway run python -c "from backend.app import create_app; from backend.models import db; app=create_app('production'); app.app_context().push(); print('Connected!'); print(f'Users: {db.session.execute(db.text(\"SELECT COUNT(*) FROM users\")).scalar()}')"
```

## Common Issues

### Issue: "relation 'users' does not exist"
**Solution**: Run migrations (`alembic upgrade head`)

### Issue: "Invalid username or password"
**Solution**: Create user account (`python backend/create_user.py ...`)

### Issue: "No module named 'psycopg2'"
**Solution**: Ensure `psycopg2-binary` is in requirements.txt (it already is)

### Issue: DATABASE_URL points to SQLite
**Solution**: Make sure the PostgreSQL service is connected to your backend service in Railway
