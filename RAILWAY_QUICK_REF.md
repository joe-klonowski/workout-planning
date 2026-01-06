# Railway Quick Reference

## Essential Commands

### Deploy to Railway
```bash
railway up
```

### Link Local Project to Railway
```bash
railway link
```

### View Logs
```bash
railway logs
```

### Run Command in Production
```bash
railway run <command>
```

### Set Environment Variable
```bash
railway variables set SECRET_KEY=your-secret-key
```

### Open Railway Dashboard
```bash
railway open
```

## First-Time Setup Checklist

1. **Deploy the app**
   - Connect GitHub repo to Railway
   - Or use `railway up`

2. **Set environment variables**
   ```bash
   railway variables set FLASK_ENV=production
   railway variables set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
   ```

3. **Create user account**
   ```bash
   railway run python backend/create_user.py <username> <password>
   ```

4. **Import workout data** (optional)
   - Use the web UI at your Railway URL
   - Or use the API endpoint

5. **Test the deployment**
   - Visit `https://your-app.up.railway.app/api/health`
   - Login at `https://your-app.up.railway.app/`

## Monitoring

- **Health check**: `https://your-app.up.railway.app/api/health`
- **View logs**: Railway dashboard or `railway logs`
- **Shell access**: Railway dashboard → Shell tab

## Common Issues

### Build Failed
```bash
# Check logs
railway logs --deployment

# Verify dependencies
cat backend/requirements.txt
cat app/package.json
```

### Can't Create User
```bash
# Check if database is initialized
railway run python -c "from backend.models import db; print('DB OK')"

# Run migrations if needed
railway run alembic upgrade head
```

### Static Files Not Loading
- Ensure `FLASK_ENV=production` is set
- Check build logs for React build errors
- Verify in logs that Flask is serving static files

## URLs

- **Main App**: `https://your-app.up.railway.app/`
- **API Health**: `https://your-app.up.railway.app/api/health`
- **API Docs**: See [backend/README.md](backend/README.md)

## For Full Documentation

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for complete deployment guide.
