#!/bin/bash

# Quick Start Script for Codette Enhanced (macOS/Linux)
# ====================================================

echo ""
echo "?????????????????????????????????????????????????????????????"
echo "?          CODETTE ENHANCED - QUICK START SCRIPT            ?"
echo "?                  Starting Services...                      ?"
echo "?????????????????????????????????????????????????????????????"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "? ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "? ERROR: Python is not installed"
    echo "Please install Python from https://python.org/"
    exit 1
fi

echo "? Node.js: $(node --version)"
echo "? Python: $(python --version)"
echo ""

# Ask user what to start
echo "Select what you want to start:"
echo ""
echo "  1) Both Frontend AND Backend (recommended)"
echo "  2) Frontend only (React dev server)"
echo "  3) Backend only (FastAPI)"
echo "  4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Starting both services..."
        echo ""
        
        # Start backend in background
        echo "Starting Backend (FastAPI on port 8000)..."
        cd Codette
        python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        cd ..
        
        sleep 2
        
        # Start frontend
        echo "Starting Frontend (React dev server on port 5173)..."
        npm run dev &
        FRONTEND_PID=$!
        
        echo ""
        echo "? Both services started!"
        echo ""
        echo "Frontend: http://localhost:5173"
        echo "Backend:  http://localhost:8000"
        echo "Docs:     http://localhost:8000/docs"
        echo ""
        echo "Press Ctrl+C to stop both services"
        echo ""
        
        # Wait for both to finish
        wait $BACKEND_PID $FRONTEND_PID
        ;;
        
    2)
        echo ""
        echo "Starting Frontend (React dev server)..."
        echo ""
        npm run dev
        ;;
        
    3)
        echo ""
        echo "Starting Backend (FastAPI)..."
        echo ""
        cd Codette
        python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
