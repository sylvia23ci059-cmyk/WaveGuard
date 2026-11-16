@echo off
setlocal enabledelayedexpansion

title WAVEGUARD Launcher - Bengaluru 3D Urban Waterlogging Intelligence

echo ===============================================================================
echo            WAVEGUARD: 3D Urban Waterlogging & Safe Route Guidance
echo                    Geographical Focus: Bengaluru, India
echo ===============================================================================
echo.

:: 1. Verify Python Installation
echo [1/4] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in system PATH.
    echo Please install Python 3.11 or later from https://www.python.org/
    pause
    exit /b 1
)
python --version

:: 2. Verify Node.js and npm
echo.
echo [2/4] Checking Node.js and npm...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in system PATH.
    echo Please install Node.js (LTS version) from https://nodejs.org/
    pause
    exit /b 1
)
node --version
npm --version

:: 3. Check / Initialize Virtual Environment
echo.
echo [3/4] Preparing Python backend environment...
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment in .venv...
    python -m venv .venv
    echo Installing backend dependencies...
    .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
) else (
    echo Virtual environment detected at .venv.
)

:: Run database initialization
echo Initializing WaveGuard SQLite database schema and Bengaluru locations...
.\.venv\Scripts\python.exe scripts\initialize_database.py

:: 4. Check Frontend node_modules
echo.
echo [4/4] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend packages...
    cd frontend
    call npm install
    cd ..
) else (
    echo Frontend dependencies verified.
)

echo.
echo ===============================================================================
echo                    STARTING WAVEGUARD DUAL SERVERS
echo ===============================================================================
echo Backend API URL:      http://127.0.0.1:8000
echo Swagger API Docs:     http://127.0.0.1:8000/docs
echo Frontend Web App:     http://localhost:5173
echo ===============================================================================
echo.

:: Start Backend in dedicated window
start "WaveGuard Backend [FastAPI:8000]" cmd /k "cd backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Start Frontend in dedicated window
start "WaveGuard Frontend [Vite:5173]" cmd /k "cd frontend && npm run dev"

echo Both WaveGuard servers are launching in separate windows!
echo Once the Vite dev server starts, open your browser at: http://localhost:5173
echo.
echo Press any key to close this launcher window (servers will continue running)...
pause >nul
