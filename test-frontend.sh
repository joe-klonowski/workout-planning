#!/bin/bash
# Script to run frontend tests for the Workout Planning application

set -e  # Exit on any error

echo "⚛️  Running Frontend Tests..."
echo "=========================================="
echo ""

cd app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Run frontend tests (non-interactive)
echo "Running npm test..."
if CI=true npm test; then
    echo ""
    echo "=========================================="
    echo "✅ Frontend tests PASSED"
    echo "=========================================="
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Frontend tests FAILED"
    echo "=========================================="
    exit 1
fi
