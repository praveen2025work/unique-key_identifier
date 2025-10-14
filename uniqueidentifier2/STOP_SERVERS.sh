#!/bin/bash

echo "Stopping servers..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill backend
if [ -f "$SCRIPT_DIR/backend/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/backend/backend.pid")
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm "$SCRIPT_DIR/backend/backend.pid"
fi

# Kill frontend
if [ -f "$SCRIPT_DIR/frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/frontend/frontend.pid")
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm "$SCRIPT_DIR/frontend/frontend.pid"
fi

# Also kill any remaining processes on those ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✅ All servers stopped"

