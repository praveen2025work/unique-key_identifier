@echo off
REM ============================================
REM Unique Key Identifier - Windows Launch Script
REM ============================================

color 0B
echo.
echo ===============================================
echo    Unique Key Identifier - Setup and Run
echo ===============================================
echo.

REM Check Python installation
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.7 or higher.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found
echo.

REM Check pip installation
echo [2/5] Checking pip installation...
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pip not found. Installing pip...
    python -m ensurepip --upgrade
)
echo [OK] pip found
echo.

REM Check if port 8000 is in use
echo [3/5] Checking port 8000...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 8000 is already in use.
    set /p kill_port="Do you want to kill the existing process? (Y/N): "
    if /i "%kill_port%"=="Y" (
        echo Stopping existing process...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo [OK] Port 8000 is now available
    ) else (
        echo [ERROR] Cannot start - port 8000 is in use.
        echo Run manually with different port:
        echo    python -m uvicorn file_comparator:app --host 0.0.0.0 --port 8080
        pause
        exit /b 1
    )
) else (
    echo [OK] Port 8000 is available
)
echo.

REM Install dependencies
echo [4/5] Installing dependencies...
if exist requirements.txt (
    pip install -q -r requirements.txt
    echo [OK] Dependencies installed
) else (
    echo [WARNING] requirements.txt not found. Installing core packages...
    pip install -q fastapi uvicorn pandas jinja2 python-multipart xlsxwriter
    echo [OK] Core packages installed
)
echo.

REM Start application
echo [5/5] Starting application...
echo.
echo ===============================================
echo            APPLICATION READY!
echo ===============================================
echo.
echo   Open browser: http://localhost:8000
echo   Press Ctrl+C to stop
echo.
echo ===============================================
echo.

REM Run the application
python file_comparator.py

REM This will only execute if the server is stopped
echo.
echo Application stopped.
pause

