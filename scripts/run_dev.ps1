# WaveGuard KGF: Development Launch Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  WAVEGUARD KGF: 3D Urban Flood Intelligence Platform     " -ForegroundColor White
Write-Host "  Study Area: Kolar Gold Fields (KGF) Taluk, Karnataka    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"

# 1. Start FastAPI Backend Server
Write-Host "[1/2] Starting FastAPI Backend & WebSocket Server on port 8000..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory "$rootDir\backend" -PassThru

# 2. Start Frontend Dev Server
Write-Host "[2/2] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
$frontendDir = Join-Path $rootDir "frontend"
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $frontendDir -PassThru

Write-Host ""
Write-Host ">> Platform servers launched successfully!" -ForegroundColor Green
Write-Host "   - Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "   - Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   - WebSocket Stream: ws://localhost:8000/ws/telemetry" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C or close this window when finished." -ForegroundColor Gray

try {
    Wait-Process -Id $backendProcess.Id, $frontendProcess.Id
} finally {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}
