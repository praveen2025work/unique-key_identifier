@echo off
REM ###############################################################################
REM Build Script for IIS Deployment (Windows)
REM This script builds the React frontend for deployment to Windows Server IIS
REM ###############################################################################

setlocal enabledelayedexpansion

set BUILD_DIR=out

echo ========================================
echo   IIS Deployment Build Script
echo ========================================
echo.

REM Step 1: Clean previous build
echo [1/5] Cleaning previous build...
if exist "%BUILD_DIR%" (
    rmdir /s /q "%BUILD_DIR%"
    echo [OK] Cleaned %BUILD_DIR% directory
) else (
    echo [OK] No previous build found
)
echo.

REM Step 2: Check Node.js and npm
echo [2/5] Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%
echo [OK] npm version: %NPM_VERSION%
echo.

REM Step 3: Install dependencies
echo [3/5] Installing dependencies...
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Step 4: Run linting
echo [4/5] Running ESLint checks...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Linting failed! Please fix errors before deploying.
    echo.
    echo Do you want to continue anyway? (Y/N)
    set /p CONTINUE=
    if /i not "!CONTINUE!"=="Y" (
        pause
        exit /b 1
    )
) else (
    echo [OK] Linting passed
)
echo.

REM Step 5: Build for production
echo [5/5] Building for production...
call npm run build:iis
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build completed
echo.

REM Verify build output
echo ========================================
echo   Build Verification
echo ========================================
echo.

if not exist "%BUILD_DIR%" (
    echo [ERROR] Build failed! Output directory not found.
    pause
    exit /b 1
)

if not exist "%BUILD_DIR%\index.html" (
    echo [ERROR] index.html not found in build output!
    pause
    exit /b 1
)

if not exist "%BUILD_DIR%\web.config" (
    echo [ERROR] web.config not found! IIS deployment requires web.config.
    pause
    exit /b 1
)

echo [OK] Build output verified
echo.

REM Display build information
echo ========================================
echo   Build Summary
echo ========================================
echo.
echo Output Directory: %CD%\%BUILD_DIR%
for /f "tokens=3" %%i in ('dir /s "%BUILD_DIR%" ^| findstr /c:"bytes"') do set BUILD_SIZE=%%i
echo Build Size: %BUILD_SIZE% bytes
echo.
echo [OK] Files ready for IIS deployment!
echo.

REM Next steps
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Copy the entire '%BUILD_DIR%' directory to your Windows Server
echo 2. Follow the instructions in IIS_DEPLOYMENT_GUIDE.md
echo 3. Ensure URL Rewrite Module is installed on IIS
echo 4. Create an IIS Application pointing to the copied directory
echo 5. Verify web.config is in the root of your IIS application
echo.
echo For detailed instructions, see: IIS_DEPLOYMENT_GUIDE.md
echo.
echo Build completed successfully!
echo.
pause

