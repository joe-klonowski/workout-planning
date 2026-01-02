#!/bin/bash
# Quick start script for the Flask backend

echo "🚀 Setting up Flask backend..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "⚠️  Virtual environment creation failed."
        echo "You may need to install: sudo apt install python3.12-venv"
        echo "Continuing without venv..."
    fi
fi

# Activate venv if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the app
echo "✅ Starting Flask server on http://localhost:5000"
python app.py
