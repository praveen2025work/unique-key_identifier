@echo off
REM Start Frontend Server for Unique Key Identifier (Windows)

echo ==========================================
echo Starting Unique Key Identifier Frontend
echo ==========================================
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the dev server
echo.
echo ==========================================
echo Starting Vite dev server...
echo ==========================================
echo.
echo Frontend will be available at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
