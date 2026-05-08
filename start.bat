@echo off
echo ========================================
echo GPU Lending Platform - Quick Start
echo ========================================
echo.

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker is not installed!
    echo Some features may not work without Docker.
    echo.
)

echo.
echo Choose an option:
echo 1. Full Setup (first time)
echo 2. Start Development Server
echo 3. Start Automated Loop
echo 4. Run Tests
echo 5. Open Prisma Studio
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running full setup...
    call npm install --legacy-peer-deps
    call docker-compose up -d
    timeout /t 5 /nobreak >nul
    call npx prisma generate
    call npx prisma migrate dev --name init
    call npx tsx prisma/seed.ts
    echo.
    echo Setup complete! You can now run option 2 or 3.
    pause
) else if "%choice%"=="2" (
    echo.
    echo Starting development server...
    call npm run dev
) else if "%choice%"=="3" (
    echo.
    echo Starting automated development loop...
    echo This will run continuously. Press Ctrl+C to stop.
    echo.
    call npm run automate
) else if "%choice%"=="4" (
    echo.
    echo Running tests...
    call node scripts/test-api.js
    pause
) else if "%choice%"=="5" (
    echo.
    echo Opening Prisma Studio...
    call npm run prisma:studio
) else (
    echo Invalid choice!
    pause
)
