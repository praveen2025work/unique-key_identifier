@echo off
echo ========================================
echo    Restarting All Services
echo ========================================
echo.

echo Stopping any running services...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    Starting Backend (Python)
echo ========================================
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
echo Installing/updating dependencies...
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo.
echo Starting backend server...
start "Backend Server" cmd /k "venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Starting Frontend (React)
echo ========================================
cd ..\frontend
echo Installing/updating dependencies...
call npm install --silent

echo.
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo    ✅ Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Check the new terminal windows for logs.
echo Press any key to exit...
pause >nul

