#!/bin/bash

echo "========================================"
echo "   Restarting All Services"
echo "========================================"
echo

# Stop existing services
echo "Stopping any running services..."
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

echo
echo "========================================"
echo "   Starting Backend (Python)"
echo "========================================"
cd backend || exit 1

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
echo "Installing/updating dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

echo
echo "Starting backend server..."
python main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Check if backend started
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start. Check backend.log"
    exit 1
fi

echo
echo "========================================"
echo "   Starting Frontend (React)"
echo "========================================"
cd ../frontend || exit 1

echo "Installing/updating dependencies..."
npm install --silent > /dev/null 2>&1

echo
echo "Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 3

# Check if frontend started
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend started successfully"
else
    echo "❌ Frontend failed to start. Check frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo
echo "========================================"
echo "   ✅ Services Started!"
echo "========================================"
echo
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo
echo "PIDs: Backend=$BACKEND_PID Frontend=$FRONTEND_PID"
echo
echo "To stop services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo
echo "Or use: ./STOP_SERVERS.sh"

