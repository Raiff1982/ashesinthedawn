@echo off
REM Quick Start Script for Codette Enhanced
REM ========================================

echo.
echo ?????????????????????????????????????????????????????????????
echo ?          CODETTE ENHANCED - QUICK START SCRIPT            ?
echo ?                  Starting Services...                      ?
echo ?????????????????????????????????????????????????????????????
echo.

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ? ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ? ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo ? Node.js: $(node --version)
echo ? Python: $(python --version)
echo.

REM Ask user what to start
echo Select what you want to start:
echo.
echo  1) Both Frontend AND Backend (recommended)
echo  2) Frontend only (React dev server)
echo  3) Backend only (FastAPI)
echo  4) Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting both services in new windows...
    echo.
    
    REM Start backend in new window
    echo Starting Backend (FastAPI on port 8000)...
    start cmd /k "cd Codette && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
    
    timeout /t 3 /nobreak
    
    REM Start frontend in new window
    echo Starting Frontend (React dev server on port 5173)...
    start cmd /k "npm run dev"
    
    echo.
    echo ? Both services started!
    echo.
    echo Frontend: http://localhost:5173
    echo Backend:  http://localhost:8000
    echo Docs:     http://localhost:8000/docs
    echo.
    pause
    
) else if "%choice%"=="2" (
    echo.
    echo Starting Frontend (React dev server)...
    echo.
    npm run dev
    
) else if "%choice%"=="3" (
    echo.
    echo Starting Backend (FastAPI)...
    echo.
    cd Codette
    python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
    
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
    
) else (
    echo Invalid choice. Exiting.
    exit /b 1
)
