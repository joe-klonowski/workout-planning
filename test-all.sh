#!/bin/bash
# Script to run all tests for the Workout Planning application
# including frontend and backend tests.

set -e  # Exit on any error

echo "🧪 Running all tests for Workout Planning application..."
echo ""

# Track overall success
BACKEND_PASSED=false
FRONTEND_PASSED=false

# ============================================================================
# Backend Tests
# ============================================================================
echo "📦 Running Backend Tests..."
echo "-------------------------------------------"
cd backend

# Check if venv exists, create if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "⚠️  Virtual environment creation failed."
        echo "You may need to install: sudo apt install python3.12-venv"
        exit 1
    fi
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
echo "Ensuring dependencies are installed..."
pip install -q -r requirements.txt

# Run backend tests
echo "Running pytest..."
if pytest -v -m "not integration"; then
    BACKEND_PASSED=true
    echo "✅ Backend tests PASSED"
else
    echo "❌ Backend tests FAILED"
fi

# Deactivate venv
deactivate

cd ..
echo ""

# ============================================================================
# Frontend Tests
# ============================================================================
echo "⚛️  Running Frontend Tests..."
echo "-------------------------------------------"
cd app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Run frontend tests (non-interactive)
echo "Running npm test..."
if CI=true npm test; then
    FRONTEND_PASSED=true
    echo "✅ Frontend tests PASSED"
else
    echo "❌ Frontend tests FAILED"
fi

cd ..
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo "Backend:  $([ "$BACKEND_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "Frontend: $([ "$FRONTEND_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "=========================================="

if [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ]; then
    echo "🎉 All tests PASSED!"
    exit 0
else
    echo "💥 Some tests FAILED"
    exit 1
fi
