#!/bin/bash

# Start Frontend Server for Unique Key Identifier
echo "=========================================="
echo "Starting Unique Key Identifier Frontend"
echo "=========================================="
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the dev server
echo ""
echo "=========================================="
echo "🚀 Starting Vite dev server..."
echo "=========================================="
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
