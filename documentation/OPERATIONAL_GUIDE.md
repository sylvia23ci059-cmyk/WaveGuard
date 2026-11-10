# WaveGuard KGF: Operational & Deployment Guide
**3D Urban Flood Intelligence and Situational Awareness Platform**
*Target Study Area: Kolar Gold Fields (KGF) Taluk, Karnataka, India*

---

## 1. Quick Start Guide (Local Development)

### Prerequisites
- Node.js (v18+) & npm (v9+)
- Python 3.11+ (Python 3.14 virtual environment included in `.venv/`)
- Git

### Step 1: Start Backend API & WebSocket Server
```powershell
# Open terminal 1
cd "c:\Users\Sylvia Trinita\OneDrive\Desktop\wavegard"
.\.venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### Step 2: Start Frontend Web Application
```powershell
# Open terminal 2
cd "c:\Users\Sylvia Trinita\OneDrive\Desktop\wavegard\frontend"
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 2. One-Click Startup Scripts

### For Windows PowerShell (`scripts/run_dev.ps1`)
```powershell
# Run from repository root
.\scripts\run_dev.ps1
```

### For Windows Command Prompt (`scripts/run_dev.bat`)
```cmd
scripts\run_dev.bat
```

---

## 3. Physical ESP32 Hardware Deployment Architecture

### Hardware Components
1. **Microcontroller**: ESP32-WROOM-32 (Dual Core 240MHz, 4MB Flash, Wi-Fi + BLE).
2. **Water-Level Sensor**: JSN-SR04T Waterproof Ultrasonic Sensor (Detection range: 20cm - 450cm, IP67 sealed transducer).
3. **Rain Gauge**: Standard Tipping Bucket Rain Gauge (0.2mm per tip resolution, pulse reed switch).
4. **Power Subsystem**: 18650 LiFePO4 battery (3.2V 3200mAh) + 5W Monocrystalline Solar Panel + CN3791 MPPT Solar Charger.
5. **Connectivity**: SIM7600EI 4G/LTE Cat-1 Cellular Breakout (UART) or local LoRaWAN transceiver.

### Edge Sensor Wiring
| Component Pin | ESP32 Pin | Function |
|---|---|---|
| JSN-SR04T Trigger | GPIO 18 | Ultrasonic pulse trigger |
| JSN-SR04T Echo | GPIO 19 | Return pulse echo duration |
| Tipping Bucket Reed | GPIO 23 | Hardware interrupt counter (Debounced) |
| Battery Voltage Divider | GPIO 34 (ADC1_CH6) | Analog voltage sampling (100k / 20k divider) |
| Cellular Modem TX/RX | GPIO 16 (RX2), GPIO 17 (TX2) | Serial AT command interface |

### Offline Buffering & Edge Alarm Protocol
- The firmware calculates water rise rate $(\Delta h / \Delta t)$ every 60 seconds.
- If water exceeds the configured `warning_threshold_m` or `critical_threshold_m`, an on-site 110dB piezo siren and high-intensity strobe light are immediately activated via GPIO relay **without requiring internet or cloud connectivity**.
- When cellular connectivity is lost, readings are buffered into SPIFFS / LittleFS non-volatile flash memory and synchronized via MQTT QoS 1 once connection is restored.

---

## 4. Field Survey & Hotspot Verification Protocol

1. **Initial Screening**: Preliminary hotspots identified from DEM depressions and high flow accumulation are marked `unverified`.
2. **Site Inspection**: Field surveyors visit the site to measure:
   - Culvert barrel width and clear opening height
   - Sedimentation depth and debris blockage percentage
   - Visible watermarks on adjacent masonry walls
   - Local resident interview notes regarding past flood depths
3. **Status Promotion**:
   - `field_surveyed`: Site inspected, geometry recorded, trash clearing scheduled.
   - `confirmed_hotspot`: Chronic structural waterlogging confirmed with photographic evidence.
   - `rejected`: Site has sufficient natural cross-fall or newly constructed stormwater drains; false positive eliminated.
