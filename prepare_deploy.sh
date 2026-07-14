#!/bin/bash
set -e

echo "======================================"
echo " Preparing Project for Deployment"
echo "======================================"

echo ""
echo "1. Checking Frontend (Vite & React)"
cd frontend
echo "Installing frontend dependencies..."
npm install
echo "Building frontend for production..."
npm run build
cd ..

echo ""
echo "2. Checking Backend (FastAPI)"
cd backend
if [ -d "venv" ]; then
    echo "Virtual environment exists."
else
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate venv on Windows (Git Bash) or Linux
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Running Pytest..."
python -m pytest tests/

echo ""
echo "======================================"
echo " All checks passed! Ready to deploy."
echo "======================================"
