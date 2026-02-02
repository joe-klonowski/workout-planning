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

# Usage helper
usage() {
    cat <<'EOF'
Usage: ./test-backend.sh [pytest-args]

Examples:
  ./test-backend.sh
  ./test-backend.sh tests/test_auth.py
  ./test-backend.sh tests/test_auth.py::TestAuthLogin::test_login_success
  ./test-backend.sh -k login
  ./test-backend.sh -m integration    # overrides default exclusion
  ./test-backend.sh -h|--help         # show this message
EOF
}

# Show help if asked
for a in "$@"; do
    case "$a" in
        -h|--help)
            usage
            exit 0
            ;;
    esac
done

# Run backend tests
if [ "$#" -gt 0 ]; then
    echo "Running pytest with args: $@"
    # If user provided -m (or -m<expr>), don't add the default exclusion
    has_m=false
    for a in "$@"; do
        if [ "$a" = "-m" ] || [[ "$a" == -m* ]]; then
            has_m=true
            break
        fi
    done
    if [ "$has_m" = true ]; then
        RUN_CMD=(pytest -v "$@")
    else
        RUN_CMD=(pytest -v -m "not integration" "$@")
    fi
else
    echo "Running pytest (default: exclude integration tests)..."
    RUN_CMD=(pytest -v -m "not integration")
fi
if "${RUN_CMD[@]}"; then
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
