#!/bin/bash
# Script to run all tests for the Workout Planning application
# including frontend and backend tests.

echo "🧪 Running all tests for Workout Planning application..."
echo ""

# Track overall success
BACKEND_PASSED=false
FRONTEND_PASSED=false

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================================
# Backend Tests
# ============================================================================
if "${SCRIPT_DIR}/test-backend.sh"; then
    BACKEND_PASSED=true
else
    BACKEND_PASSED=false
fi

echo ""

# ============================================================================
# Frontend Tests
# ============================================================================
if "${SCRIPT_DIR}/test-frontend.sh"; then
    FRONTEND_PASSED=true
else
    FRONTEND_PASSED=false
fi

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
