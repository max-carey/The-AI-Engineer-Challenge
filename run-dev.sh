#!/bin/bash

# Function to cleanup background processes on script exit
cleanup() {
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up cleanup trap
trap cleanup EXIT

echo "🌲 Starting Forest AI development services..."

# Start the frontend service in the background
cd frontend
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing frontend dependencies..."
    npm install
fi
npm run dev &

# Start the backend service
cd ../api

# Check if we need to recreate the virtual environment
if [ -d "venv" ]; then
    # Try to activate and check if it works
    source venv/bin/activate 2>/dev/null
    if [ -z "$VIRTUAL_ENV" ] || ! [ -f "$VIRTUAL_ENV/bin/python" ]; then
        echo "🔄 Existing virtual environment is invalid or broken"
        echo "🗑️  Removing old virtual environment..."
        deactivate 2>/dev/null
        rm -rf venv
    fi
fi

# Create virtual environment if it doesn't exist or was removed
if [ ! -d "venv" ]; then
    echo "🌱 Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
else
    echo "🔄 Activating virtual environment..."
    source venv/bin/activate
fi

# Always update dependencies to catch new packages
echo "📦 Updating Python packages..."
pip install -r requirements.txt

# Copy aimakerspace package into venv site-packages
echo "📦 Installing aimakerspace package..."
cd ..
rm -rf api/venv/lib/python*/site-packages/aimakerspace
cp -r aimakerspace api/venv/lib/python*/site-packages/
cd api

# Verify virtual environment activation
if [ -z "$VIRTUAL_ENV" ] || ! [ -f "$VIRTUAL_ENV/bin/python" ]; then
    echo "❌ Error: Virtual environment activation failed"
    exit 1
fi

echo "✅ Virtual environment activated successfully"

# Run backend in foreground so we can see the output
echo "🚀 Starting backend server..."
"$VIRTUAL_ENV/bin/python" app.py

# Wait for all background processes
wait

# Exit
exit $? 