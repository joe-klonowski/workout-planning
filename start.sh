#!/bin/bash
# Start both backend and frontend servers

echo "🚀 Starting Workout Planner..."

# Start Flask backend
echo "Starting Flask backend on port 5000..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "⚠️  Backend may not be responding"
fi

# Start React frontend
echo "Starting React frontend on port 3000..."
cd app
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
