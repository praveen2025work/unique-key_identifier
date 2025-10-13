@echo off
:: Quick start script for Unique Key Identifier v2.0 (Windows)

echo 🚀 Starting Unique Key Identifier v2.0...
echo.

:: Check if we're in the right directory
if not exist "frontend" (
    echo ❌ Error: Please run this script from the uniqueidentifier2\ directory
    pause
    exit /b 1
)
if not exist "backend" (
    echo ❌ Error: Please run this script from the uniqueidentifier2\ directory
    pause
    exit /b 1
)

:: Check prerequisites
echo 🔍 Checking prerequisites...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is required but not installed
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is required but not installed
    pause
    exit /b 1
)

echo ✅ All prerequisites found
echo.

:: Start backend
echo 🐍 Starting Python Backend...
cd backend

:: Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Install dependencies if not installed
if not exist "venv\.installed" (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    echo. > venv\.installed
)

:: Create .env if it doesn't exist
if not exist ".env" (
    copy .env.example .env
    echo Created .env file from template
)

:: Start the backend server
echo Starting FastAPI server on http://localhost:8000
start "Backend Server" cmd /k "python start.py"

cd ..

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
echo.
echo ⚛️ Starting React Frontend...
cd frontend

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

:: Create .env if it doesn't exist
if not exist ".env" (
    copy .env.example .env
    echo Created frontend .env file from template
)

:: Start the development server
echo Starting React dev server on http://localhost:5173
start "Frontend Server" cmd /k "npm run dev"

cd ..

echo.
echo 🎉 Applications started successfully!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo 📄 Sample files available in backend\:
echo    - sample_data_a.csv
echo    - sample_data_b.csv
echo.
echo Both servers are running in separate windows.
echo Close the server windows to stop the applications.
echo.
pause