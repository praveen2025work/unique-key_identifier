#!/bin/bash

echo "=================================================="
echo "🚀 Starting Unique Key Identifier v2.0"
echo "=================================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to start backend
start_backend() {
    echo "📦 Starting Backend Server..."
    cd "$SCRIPT_DIR/backend"
    
    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate venv and install dependencies
    source venv/bin/activate
    pip install -q -r requirements.txt
    
    # Start backend
    echo "✅ Backend starting on http://localhost:8000"
    python main.py &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Wait for backend to start
    sleep 3
}

# Function to start frontend
start_frontend() {
    echo ""
    echo "⚛️  Starting Frontend Server..."
    cd "$SCRIPT_DIR/frontend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    
    # Start frontend
    echo "✅ Frontend starting on http://localhost:5173"
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
}

# Start both servers
start_backend
start_frontend

echo ""
echo "=================================================="
echo "✅ Both servers are starting!"
echo "=================================================="
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Wait 10-15 seconds, then open http://localhost:5173 in your browser"
echo ""
echo "To stop servers, run: ./STOP_SERVERS.sh"
echo "Or press Ctrl+C"
echo ""

# Keep script running
wait

