#!/bin/bash
set -e

# Navigate to backend directory
cd backend

# Start gunicorn
exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app
