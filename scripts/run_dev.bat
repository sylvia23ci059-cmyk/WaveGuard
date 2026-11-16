@echo off
title WaveGuard KGF Launch Launcher
echo ==========================================================
echo   WAVEGUARD KGF: 3D Urban Flood Intelligence Platform
echo   Study Area: Kolar Gold Fields (KGF) Taluk, Karnataka
echo ==========================================================
echo.
echo [1/2] Starting Backend Server on port 8000...
start "WaveGuard Backend" cmd /k "cd /d %~dp0..\backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Frontend Dev Server on port 5173...
start "WaveGuard Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo.
echo Platform launched:
echo - Frontend UI: http://localhost:5173
echo - Backend API: http://localhost:8000/docs
echo.
pause
