#!/bin/bash

# Script to check if frontend and backend are running

echo "Checking application status..."
echo ""

# Check backend
if pgrep -f "python.*app.py" > /dev/null; then
    echo "✅ Backend is RUNNING"
    BACKEND_RUNNING=true
else
    echo "❌ Backend is NOT running"
    echo "   To start: cd backend && ./run.sh"
    BACKEND_RUNNING=false
fi

# Check frontend
if pgrep -f "react-scripts start" > /dev/null; then
    echo "✅ Frontend is RUNNING"
    echo "   Available at: http://localhost:3000"
    FRONTEND_RUNNING=true
else
    echo "❌ Frontend is NOT running"
    echo "   To start: cd app && npm start"
    FRONTEND_RUNNING=false
fi

echo ""

# Summary
if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo "🎉 All services are running!"
    exit 0
elif [ "$BACKEND_RUNNING" = true ] || [ "$FRONTEND_RUNNING" = true ]; then
    echo "⚠️  Some services are not running"
    exit 1
else
    echo "❌ No services are running"
    echo "   To start all: ./start.sh"
    exit 1
fi
