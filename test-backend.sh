#!/bin/bash
# Script to run backend tests for the Workout Planning application

set -e  # Exit on any error

echo "📦 Running Backend Tests..."
echo "=========================================="
echo ""

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
    echo ""
    echo "=========================================="
    echo "✅ Backend tests PASSED"
    echo "=========================================="
    deactivate
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Backend tests FAILED"
    echo "=========================================="
    deactivate
    exit 1
fi
