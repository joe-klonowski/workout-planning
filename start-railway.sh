#!/bin/bash
set -e

# Navigate to backend directory
cd backend

# Start gunicorn using Python module
exec python3 -m gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app
