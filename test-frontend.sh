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

# Usage helper
usage() {
    cat <<'EOF'
Usage: ./test-frontend.sh [jest-args]

Examples:
  ./test-frontend.sh
  ./test-frontend.sh "MyTestNamePattern"
  ./test-frontend.sh --testPathPattern="Calendar.test.js"
  ./test-frontend.sh -h|--help    # show this message

Note: the script appends --watchAll=false when no watch flag is provided to keep runs CI-friendly.
EOF
}

# Show help if requested
for a in "$@"; do
    case "$a" in
        -h|--help)
            usage
            exit 0
            ;;
    esac
done

# Run frontend tests (non-interactive)
if [ "$#" -gt 0 ]; then
    # User provided test args; forward them to npm test and ensure non-interactive run
    has_watch=false
    for a in "$@"; do
        if [[ "$a" == *"--watchAll"* ]] || [[ "$a" == *"--watch"* ]]; then
            has_watch=true
            break
        fi
    done
    ARGS=("$@")
    if [ "$has_watch" = false ]; then
        ARGS+=("--watchAll=false")
    fi
    echo "Running npm test with args: ${ARGS[*]}"
    if CI=true npm test -- "${ARGS[@]}"; then
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
else
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
fi
