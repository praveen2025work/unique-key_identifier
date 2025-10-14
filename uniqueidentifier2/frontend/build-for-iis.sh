#!/bin/bash

###############################################################################
# Build Script for IIS Deployment
# This script builds the React frontend for deployment to Windows Server IIS
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="out"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  IIS Deployment Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Clean previous build
echo -e "${YELLOW}[1/5] Cleaning previous build...${NC}"
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    echo -e "${GREEN}✓ Cleaned $BUILD_DIR directory${NC}"
else
    echo -e "${GREEN}✓ No previous build found${NC}"
fi
echo ""

# Step 2: Check Node.js and npm
echo -e "${YELLOW}[2/5] Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Run linting
echo -e "${YELLOW}[4/5] Running ESLint checks...${NC}"
if npm run lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}✗ Linting failed! Please fix errors before deploying.${NC}"
    exit 1
fi
echo ""

# Step 5: Build for production
echo -e "${YELLOW}[5/5] Building for production...${NC}"
npm run build:iis
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Verify build output
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Build Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}✗ Build failed! Output directory not found.${NC}"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}✗ index.html not found in build output!${NC}"
    exit 1
fi

if [ ! -f "$BUILD_DIR/web.config" ]; then
    echo -e "${RED}✗ web.config not found! IIS deployment requires web.config.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build output verified${NC}"
echo ""

# Display build information
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Build Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Output Directory: ${GREEN}$SCRIPT_DIR/$BUILD_DIR${NC}"
echo -e "Build Size: ${GREEN}$(du -sh $BUILD_DIR | cut -f1)${NC}"
echo ""
echo -e "${GREEN}✓ Files ready for IIS deployment!${NC}"
echo ""

# Next steps
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. Copy the entire '$BUILD_DIR' directory to your Windows Server"
echo "2. Follow the instructions in IIS_DEPLOYMENT_GUIDE.md"
echo "3. Ensure URL Rewrite Module is installed on IIS"
echo "4. Create an IIS Application pointing to the copied directory"
echo "5. Verify web.config is in the root of your IIS application"
echo ""
echo -e "${YELLOW}For detailed instructions, see: IIS_DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}Build completed successfully!${NC}"

