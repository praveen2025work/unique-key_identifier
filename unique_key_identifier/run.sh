#!/bin/bash

##############################################
# Unique Key Identifier - Launch Script
# Automated setup and run script
##############################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   Unique Key Identifier - Setup & Run    ║"
echo "╔═══════════════════════════════════════════╝"
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check Python installation
echo -e "${BLUE}[1/5]${NC} Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"
else
    echo -e "${RED}✗${NC} Python 3 not found. Please install Python 3.7 or higher."
    exit 1
fi

# Check pip installation
echo -e "${BLUE}[2/5]${NC} Checking pip installation..."
if command -v pip3 &> /dev/null; then
    echo -e "${GREEN}✓${NC} pip3 found"
else
    echo -e "${RED}✗${NC} pip3 not found. Installing pip..."
    python3 -m ensurepip --upgrade
fi

# Check if port 8000 is available
echo -e "${BLUE}[3/5]${NC} Checking if port 8000 is available..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Port 8000 is already in use."
    read -p "Do you want to kill the existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}→${NC} Stopping existing process..."
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✓${NC} Port 8000 is now available"
    else
        echo -e "${RED}✗${NC} Cannot start - port 8000 is in use."
        echo -e "${YELLOW}→${NC} Run manually with different port:"
        echo "   python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8080"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port 8000 is available"
fi

# Install/update dependencies
echo -e "${BLUE}[4/5]${NC} Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -q -r requirements.txt
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} requirements.txt not found. Installing core packages..."
    pip3 install -q fastapi uvicorn pandas jinja2 python-multipart xlsxwriter
    echo -e "${GREEN}✓${NC} Core packages installed"
fi

# Start application
echo -e "${BLUE}[5/5]${NC} Starting application..."
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗"
echo -e "║           🚀 APPLICATION READY!           ║"
echo -e "╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}→${NC} Open browser: ${GREEN}http://localhost:8000${NC}"
echo -e "  ${BLUE}→${NC} Press ${YELLOW}Ctrl+C${NC} to stop"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run the application
python3 file_comparator.py

# This will only execute if the server is stopped
echo ""
echo -e "${BLUE}→${NC} Application stopped."

