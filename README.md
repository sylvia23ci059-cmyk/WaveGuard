# WAVEGUARD
## 3D Urban Waterlogging Monitoring & Safe Route Guidance System
**Geographical Focus:** Bengaluru, Karnataka, India  
**Target Domain:** Smart City / Urban Infrastructure / GIS / IoT Telemetry  
**License:** Open Academic Prototype License

---

## Executive Summary

**WaveGuard** is an interactive 3D geospatial intelligence and safe detour guidance application engineered specifically for **Bengaluru, Karnataka, India**.

After intense pre-monsoon and monsoon downpours, stormwater rapidly accumulates in Bengaluru's subways, low-lying road depressions, and railway underpasses (e.g., Marathahalli, Silk Board, Hebbal, Okalipuram, KR Circle). Commercial navigation apps fail to provide verified underpass water depth readings, often leading drivers directly into flooded hazards.

WaveGuard solves this problem by:
1. Maintaining a persistent inventory of vulnerable Bengaluru underpasses with location-specific clearance thresholds.
2. Continuously ingesting and validating water depth measurements.
3. Automatically classifying roadway safety states: **NORMAL**, **CAUTION**, **CONFIRMED_BLOCKED**, or **UNKNOWN**.
4. Rendering an interactive 3D digital twin map with building extrusions and status markers.
5. Utilizing a deterministic **NetworkX Dijkstra algorithm** to guide commuters through safe alternative detours around blocked underpass segments.
6. Providing an optional **Groq AI Assistant** grounded directly in real database telemetry.

> **Important Disclosure:** This college prototype uses a **simulated data pipeline** for testing and demonstration. Physical ESP32 microcontrollers and ultrasonic transducers are planned for future field deployment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Python Installation Guidance](#2-python-installation-guidance)
3. [Node.js & npm Installation Guidance](#3-nodejs--npm-installation-guidance)
4. [How to Open the Project in Visual Studio Code](#4-how-to-open-the-project-in-visual-studio-code)
5. [How to Create a Python Virtual Environment](#5-how-to-create-a-python-virtual-environment)
6. [How to Install Backend Dependencies](#6-how-to-install-backend-dependencies)
7. [How to Install Frontend Dependencies](#7-how-to-install-frontend-dependencies)
8. [How to Initialize the Database](#8-how-to-initialize-the-database)
9. [How to Configure the Groq AI Assistant](#9-how-to-configure-the-groq-ai-assistant)
10. [How to Run the Backend Service](#10-how-to-run-the-backend-service)
11. [How to Run the Frontend Service](#11-how-to-run-the-frontend-service)
12. [One-Click Startup with Windows Batch File](#12-one-click-startup-with-windows-batch-file)
13. [How to Use the Telemetry Simulator](#13-how-to-use-the-telemetry-simulator)
14. [How to Test Dijkstra Detour Routing](#14-how-to-test-dijkstra-detour-routing)
15. [Running Automated Test Suites](#15-running-automated-test-suites)
16. [Troubleshooting Guide](#16-troubleshooting-guide)

---

## 1. Prerequisites

Before running WaveGuard on Windows 10 or 11, verify that you have:
- **Operating System:** Windows 10/11 (64-bit).
- **Python:** Version 3.11 or later.
- **Node.js:** Version 18.0 or later (Node.js 20+ LTS recommended).
- **Browser:** Modern Chromium-based browser (Chrome, Edge, Brave) or Firefox with WebGL enabled.
- **Editor:** Visual Studio Code.

---

## 2. Python Installation Guidance

1. Download the official installer from [Python.org Downloads](https://www.python.org/downloads/).
2. Run the installer.
3. **CRITICAL:** Check the box **"Add python.exe to PATH"** on the very first installer screen before clicking "Install Now".
4. Open PowerShell or Command Prompt and verify:
   ```powershell
   python --version
   ```

---

## 3. Node.js & npm Installation Guidance

1. Download the Node.js LTS installer from [Nodejs.org](https://nodejs.org/).
2. Follow standard installer prompts with default settings.
3. Open PowerShell or Command Prompt and verify:
   ```powershell
   node --version
   npm --version
   ```

---

## 4. How to Open the Project in Visual Studio Code

1. Launch Visual Studio Code.
2. Click **File** → **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the `WaveGuard` directory.
4. Open the integrated terminal in VS Code using ``Ctrl + ` `` or **Terminal** → **New Terminal**.

---

## 5. How to Create a Python Virtual Environment

In the root project directory:
```powershell
# Create the virtual environment
python -m venv .venv

# Activate the virtual environment in PowerShell
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell displays an Execution Policy restriction, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

---

## 6. How to Install Backend Dependencies

With `.venv` activated:
```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
```

---

## 7. How to Install Frontend Dependencies

Navigate into the `frontend` folder and run:
```powershell
cd frontend
npm install
cd ..
```

---

## 8. How to Initialize the Database

WaveGuard uses SQLite with SQLAlchemy ORM. Initialize the database schema and seed authentic demonstration locations with:
```powershell
.\.venv\Scripts\python.exe scripts/initialize_database.py
```
This creates `waveguard.db` and populates 12 vulnerable underpass locations across Bengaluru (Marathahalli, Silk Board, Hebbal, Okalipuram, etc.) with road network segments.

To reset the database at any time back to a clean baseline state:
```powershell
.\.venv\Scripts\python.exe scripts/reset_demo_data.py
```

---

## 9. How to Configure the Groq AI Assistant

WaveGuard includes an optional data-grounded AI copilot powered by Groq.

1. Open `backend/.env` (or copy from `backend/.env.example`):
   ```ini
   PROJECT_NAME="WAVEGUARD - 3D Urban Waterlogging Monitoring & Safe Route Guidance"
   ENVIRONMENT="development"
   PORT=8000
   DATABASE_URL="sqlite:///./waveguard.db"
   CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
   FRESHNESS_WINDOW_MINUTES=30
   GROQ_API_KEY="your_groq_api_key_here"
   GROQ_MODEL="openai/gpt-oss-120b"
   SIMULATOR_INTERVAL_SECONDS=5
   ```
2. Paste your Groq API key in `GROQ_API_KEY`.
3. If no key is provided, WaveGuard continues to function 100% normally and seamlessly engages its intelligent, grounded local rule-based response engine.

---

## 10. How to Run the Backend Service

In a terminal window from the project root:
```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check Endpoint:** `http://127.0.0.1:8000/api/health`

---

## 11. How to Run the Frontend Service

In a separate terminal window:
```powershell
cd frontend
npm run dev
```
The Vite development server will start at:
- **Web App URL:** `http://localhost:5173`

Open `http://localhost:5173` in your web browser.

---

## 12. One-Click Startup with Windows Batch File

For maximum ease of use on Windows, double-click the included batch file:
```
start_waveguard.bat
```
This launcher automatically:
1. Verifies Python and Node.js.
2. Initializes the SQLite database schema if needed.
3. Launches the FastAPI backend in one dedicated terminal window.
4. Launches the Vite React frontend in a second terminal window.
5. Displays direct browser links.

---

## 13. How to Use the Telemetry Simulator

1. Navigate to **Water Monitoring** in the sidebar.
2. Click **Start Engine** to begin the background simulation loop (updates every 5 seconds).
3. Test various storm scenarios:
   - **Dry Weather:** All underpasses clear (0 – 3 cm, `NORMAL`).
   - **Light Showers:** Minor water accumulation (5 – 12 cm).
   - **Monsoon Surge:** Acute rainfall; **Marathahalli Underpass** (40+ cm) and **Silk Board Underpass** (45+ cm) transition to **CONFIRMED_BLOCKED**.
   - **Cloudburst Surge:** Citywide inundation of subways and arterial low-points.
   - **Pump Drainage:** Storm pumps active; depths drop back toward normal clearance.
4. Use **Manual Water Depth Entry** to inject custom test readings into any specific underpass.

---

## 14. How to Test Dijkstra Detour Routing

1. In the sidebar, open **Route Guidance**.
2. Select an origin and destination (e.g., **Domlur** to **Central Silk Board**).
3. Ensure **"Avoid CONFIRMED_BLOCKED roads"** is checked.
4. Click **Calculate Safe Transit Route**:
   - When **Marathahalli** or **Silk Board** is flooded (`BLOCKED`), the routing engine omits the blocked highway segment and automatically calculates a safe detour (e.g., via Koramangala 100ft Road / Inner Ring Road).
   - The map visually highlights the **Safe Route** in solid cyan and the **Avoided Blocked Road** in dashed red.
   - The system displays total distance, step-by-step corridor names, and a plain-English explanation.

---

## 15. Running Automated Test Suites

WaveGuard includes full automated test coverage for backend APIs, routing, classification, simulation, and frontend production compilation:

```powershell
# 1. Run Backend Pytest Suite
.\.venv\Scripts\python.exe -m pytest backend/tests -v

# 2. Run Frontend Production TypeScript Build
cd frontend
npm run build
```

---

## 16. Troubleshooting Guide

### Port 8000 or 5173 Already in Use
If another application is using port 8000 or 5173:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000
# Kill the process by PID
taskkill /F /PID <PID_NUMBER>
```

### Map Renders Blank or Tiles Fail to Load
- Ensure your computer is connected to the internet to load OpenFreeMap vector tiles on first load.
- If OpenFreeMap is blocked by your firewall or offline, the application displays an informative notification banner while preserving all coordinates, markers, routing calculations, and dashboard data.

### Virtual Environment Activation Blocked
If Windows PowerShell reports an execution policy error:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Groq API Rate Limit or Network Error
WaveGuard is engineered with a fail-safe fallback. If the Groq API key is invalid, missing, or rate-limited, the system automatically engages its local grounded rule-based engine, answering questions accurately based on current SQLite database records without crashing.
