@echo off
REM Start Backend Server for Unique Key Identifier (Windows)

echo ==========================================
echo Starting Unique Key Identifier Backend
echo ==========================================
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Start the server
echo.
echo ==========================================
echo Starting FastAPI server...
echo ==========================================
echo.
echo Backend running at: http://localhost:8000
echo API Docs available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
