# PowerShell Deployment Script for IIS
# This script builds the frontend and prepares it for IIS deployment

param(
    [string]$IISPath = "C:\inetpub\wwwroot\uniquekey-frontend",
    [string]$SiteName = "UniqueKeyIdentifierFrontend",
    [switch]$SkipBuild = $false,
    [switch]$CreateZip = $true
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Frontend Deployment Script for IIS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed!" -ForegroundColor Red
    Write-Host "    Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "[✓] npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] npm is not installed!" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "[i] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[✓] Dependencies installed" -ForegroundColor Green
}

# Build the application
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[i] Building production bundle..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[✓] Build completed successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[i] Skipping build (using existing dist folder)" -ForegroundColor Yellow
}

# Verify dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "[✗] dist folder not found!" -ForegroundColor Red
    Write-Host "    Run without -SkipBuild flag to build the application" -ForegroundColor Yellow
    exit 1
}

# Verify web.config exists
if (-not (Test-Path "dist/web.config")) {
    Write-Host "[!] Warning: web.config not found in dist folder" -ForegroundColor Yellow
    Write-Host "    Copying from public/web.config..." -ForegroundColor Yellow
    if (Test-Path "public/web.config") {
        Copy-Item "public/web.config" "dist/web.config"
        Write-Host "[✓] web.config copied" -ForegroundColor Green
    } else {
        Write-Host "[✗] web.config not found in public folder either!" -ForegroundColor Red
        exit 1
    }
}

# Create deployment package
if ($CreateZip) {
    Write-Host ""
    Write-Host "[i] Creating deployment package..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $zipName = "frontend-deploy-$timestamp.zip"
    
    # Remove old zip if exists
    if (Test-Path $zipName) {
        Remove-Item $zipName -Force
    }
    
    # Create zip
    Compress-Archive -Path "dist\*" -DestinationPath $zipName -Force
    
    if (Test-Path $zipName) {
        $zipSize = (Get-Item $zipName).Length / 1MB
        Write-Host "[✓] Deployment package created: $zipName ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "[✗] Failed to create deployment package" -ForegroundColor Red
        exit 1
    }
}

# Display build information
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Build Information" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Count files in dist
$fileCount = (Get-ChildItem -Path "dist" -Recurse -File).Count
$distSize = (Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "Build output:     dist/" -ForegroundColor White
Write-Host "Total files:      $fileCount" -ForegroundColor White
Write-Host "Total size:       $([math]::Round($distSize, 2)) MB" -ForegroundColor White
Write-Host ""

# Display file structure
Write-Host "Files in dist folder:" -ForegroundColor White
Get-ChildItem -Path "dist" -Recurse | Select-Object -First 20 | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 6)
    Write-Host "  $relativePath" -ForegroundColor Gray
}

if ($fileCount -gt 20) {
    Write-Host "  ... and $($fileCount - 20) more files" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual Deployment:" -ForegroundColor Yellow
Write-Host "  1. Copy the contents of the 'dist' folder to:" -ForegroundColor White
Write-Host "     $IISPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Or extract the deployment package:" -ForegroundColor White
if ($CreateZip) {
    Write-Host "     $zipName" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  3. Configure IIS:" -ForegroundColor White
Write-Host "     - Create/Update site: $SiteName" -ForegroundColor Cyan
Write-Host "     - Set physical path to: $IISPath" -ForegroundColor Cyan
Write-Host "     - Verify URL Rewrite module is installed" -ForegroundColor Cyan
Write-Host ""
Write-Host "Automatic Deployment (if running on IIS server):" -ForegroundColor Yellow
Write-Host "  Run this script with administrator privileges:" -ForegroundColor White
Write-Host "  .\deploy-to-iis.ps1 -IISPath '$IISPath' -SiteName '$SiteName'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  See IIS_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor White
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin -and (Test-Path $IISPath)) {
    Write-Host ""
    $deploy = Read-Host "Do you want to deploy to IIS now? (y/N)"
    
    if ($deploy -eq 'y' -or $deploy -eq 'Y') {
        Write-Host ""
        Write-Host "[i] Deploying to IIS..." -ForegroundColor Yellow
        
        # Stop site if it exists
        try {
            $site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
            if ($site) {
                Write-Host "[i] Stopping site: $SiteName" -ForegroundColor Yellow
                Stop-Website -Name $SiteName
            }
        } catch {
            Write-Host "[!] Could not stop site (it may not exist yet)" -ForegroundColor Yellow
        }
        
        # Create backup
        if (Test-Path $IISPath) {
            $backupPath = "$IISPath-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Write-Host "[i] Creating backup: $backupPath" -ForegroundColor Yellow
            Copy-Item -Path $IISPath -Destination $backupPath -Recurse -Force
            Write-Host "[✓] Backup created" -ForegroundColor Green
        }
        
        # Clear existing files
        if (Test-Path $IISPath) {
            Write-Host "[i] Clearing existing files..." -ForegroundColor Yellow
            Remove-Item -Path "$IISPath\*" -Recurse -Force
        } else {
            New-Item -Path $IISPath -ItemType Directory -Force | Out-Null
        }
        
        # Copy new files
        Write-Host "[i] Copying new files..." -ForegroundColor Yellow
        Copy-Item -Path "dist\*" -Destination $IISPath -Recurse -Force
        Write-Host "[✓] Files copied" -ForegroundColor Green
        
        # Start site
        try {
            Write-Host "[i] Starting site: $SiteName" -ForegroundColor Yellow
            Start-Website -Name $SiteName
            Write-Host "[✓] Site started" -ForegroundColor Green
        } catch {
            Write-Host "[!] Could not start site" -ForegroundColor Yellow
            Write-Host "    You may need to create the site in IIS Manager first" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "[✓] Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

