#!/bin/bash

# Start Backend Server for Unique Key Identifier
echo "=========================================="
echo "Starting Unique Key Identifier Backend"
echo "=========================================="
echo ""

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start the server
echo ""
echo "=========================================="
echo "🚀 Starting FastAPI server..."
echo "=========================================="
echo ""
echo "Backend running at: http://localhost:8000"
echo "API Docs available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
