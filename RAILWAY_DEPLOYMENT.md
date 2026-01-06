# Deployment Guide: Railway

This guide explains how to deploy the Workout Planner app to Railway.

## Overview

The app consists of:
- **Backend**: Flask API with SQLite database
- **Frontend**: React app (served as static files by Flask in production)

In production, the Flask backend serves both the API endpoints and the React frontend static files.

## Prerequisites

1. A [Railway](https://railway.app) account
2. Railway CLI installed (optional, but recommended):
   ```bash
   npm i -g @railway/cli
   ```
3. GitHub repository with your code

## Deployment Steps

### Step 1: Connect Repository to Railway

1. Go to [railway.app](https://railway.app) and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `workout-planning` repository
5. Railway will automatically detect the configuration from `railway.json` and `railway.toml`

### Step 2: Configure Environment Variables

In the Railway dashboard for your project, go to the "Variables" tab and add:

#### Required Variables:
- `FLASK_ENV` = `production`
- `SECRET_KEY` = `<generate-a-secure-random-string>` (use a password generator)
- `PORT` = `5000` (Railway auto-sets this, but you can verify)

#### Optional Variables (for CalDAV integration):
- `CALDAV_URL` = `https://caldav.icloud.com/` (or your CalDAV server)
- `CALDAV_USERNAME` = `your-email@icloud.com`
- `CALDAV_PASSWORD` = `your-app-specific-password`
- `CALDAV_CALENDAR_NAME` = `Workout Planner` (optional, name of calendar to use)

#### Database (Railway will handle this automatically):
Railway provides PostgreSQL, but we're using SQLite which stores in the container filesystem.

**Important Note**: With SQLite on Railway, your data will be lost on redeploy. For persistent data, you have two options:
1. **Use Railway PostgreSQL** (recommended for production):
   - Add a PostgreSQL database service in Railway
   - Railway will automatically set `DATABASE_URL`
   - Install `psycopg2-binary` in requirements.txt
   
2. **Use Railway Volumes** (for SQLite persistence):
   - Mount a persistent volume at `/app/backend` in Railway dashboard
   - See: https://docs.railway.app/reference/volumes

### Step 3: Generate Secret Key

Generate a secure secret key for JWT tokens:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add this value to the `SECRET_KEY` environment variable in Railway.

### Step 4: Deploy

Railway will automatically deploy when you push to your repository's main branch.

You can also manually deploy:
```bash
railway up
```

### Step 5: Initialize the Database

After first deployment, you need to create your user account.

#### Option A: Using Railway CLI
```bash
# Connect to your Railway project
railway link

# Run the create_user script
railway run python backend/create_user.py <username> <password>
```

#### Option B: Using Railway Shell
1. In Railway dashboard, go to your service
2. Click "Deploy" tab → "Shell" (or use the "Shell" tab)
3. Run:
   ```bash
   cd backend
   python create_user.py <username> <password>
   ```

### Step 6: Access Your App

Your app will be available at this URL: https://workout-planning-production.up.railway.app/

The username to log in is "joe" and the password is in Joe's bitwarden (search for that URL if bitwarden has trouble finding it).

## Updating the Frontend to Use Production URL

The frontend automatically detects the API URL:
- In development: Uses `http://localhost:5000` (via proxy in package.json)
- In production: Uses the same domain (since Flask serves the React app)

If you need to configure a custom API URL, set `REACT_APP_API_URL` environment variable during the build phase.

## Post-Deployment

### Import Workout Data

After creating your user account, you can import workout data:

1. Prepare your `workouts.csv` file
2. Use the import endpoint via the web UI or API:
   ```bash
   curl -X POST https://your-app.up.railway.app/api/workouts/import \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@workouts.csv"
   ```

### Monitor Your App

- **Logs**: View in Railway dashboard under "Deployments" → Click on a deployment → "View Logs"
- **Metrics**: Railway provides CPU, memory, and network metrics
- **Health Check**: Visit `https://your-app.up.railway.app/api/health`

## Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Verify all dependencies are in `requirements.txt` and `package.json`
- Ensure Python version compatibility (currently using Python 3.10)

### App Won't Start
- Check environment variables are set correctly
- Look for errors in deployment logs
- Verify `FLASK_ENV=production` is set

### Database Issues
- For persistent data, consider switching to Railway PostgreSQL
- Check if database migrations need to run:
  ```bash
  railway run alembic upgrade head
  ```

### Static Files Not Loading
- Verify the React build completed successfully (check logs)
- Ensure `FLASK_ENV=production` is set
- Check that build files exist in `app/build/` directory

## Files Created for Deployment

- `railway.json` - Railway service configuration
- `railway.toml` - Build configuration using Railpack builder (Python + Node.js)
- `Procfile` - Process commands for Railway (backup method)
- Updated `backend/requirements.txt` - Added `gunicorn` for production server
- Updated `backend/app.py` - Added static file serving for production

## Using PostgreSQL Instead of SQLite

For a production deployment with persistent data, follow these steps:

### 1. Add PostgreSQL to Railway
1. In Railway dashboard, click "+ New" → "Database" → "PostgreSQL"
2. Railway will automatically add `DATABASE_URL` to your environment variables

### 2. Update Backend Dependencies
Add PostgreSQL driver to `backend/requirements.txt`:
```
psycopg2-binary==2.9.11
```

### 3. Update Database URI
The Flask app already reads `DATABASE_URL` from environment variables, so no code changes needed. However, Railway's PostgreSQL uses `postgres://` but SQLAlchemy 1.4+ requires `postgresql://`:

Add this to `backend/config.py`:
```python
# Fix for Railway PostgreSQL URL format
database_uri = os.environ.get('DATABASE_URL')
if database_uri and database_uri.startswith('postgres://'):
    database_uri = database_uri.replace('postgres://', 'postgresql://', 1)
SQLALCHEMY_DATABASE_URI = database_uri or \
    'sqlite:///' + os.path.join(basedir, 'workout_planner.db')
```

### 4. Run Migrations
After deploying with PostgreSQL:
```bash
railway run alembic upgrade head
railway run python backend/create_user.py <username> <password>
```

## Continuous Deployment

Railway automatically deploys when you push to your main branch. To disable auto-deploy:
1. Go to Railway dashboard → Settings
2. Find "Deployments" section
3. Toggle off "Automatic Deployments"

## Cost Considerations

Railway provides:
- **Free tier**: $5 credit per month (enough for small apps)
- **Usage-based pricing**: ~$0.000463 per minute of container runtime

For this app with SQLite, expect minimal costs. With PostgreSQL, add ~$5-10/month for database.

## Security Checklist

- [ ] Set strong `SECRET_KEY` (never commit to git)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (Railway provides this automatically)
- [ ] Regularly update dependencies
- [ ] Monitor Railway logs for suspicious activity
- [ ] Use strong passwords for user accounts
- [ ] Consider adding rate limiting for API endpoints

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Guide](https://docs.railway.app/develop/cli)
- [Flask Production Deployment](https://flask.palletsprojects.com/en/3.0.x/deploying/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
