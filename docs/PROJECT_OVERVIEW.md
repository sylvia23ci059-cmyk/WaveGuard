# WAVEGUARD: 3D URBAN WATERLOGGING MONITORING & SAFE ROUTE GUIDANCE SYSTEM

**Geographical Focus:** Bengaluru, Karnataka, India  
**Project Category:** Smart City / Urban Infrastructure / GIS / IoT Telemetry  
**Target Stakeholders:** Bruhat Bengaluru Mahanagara Palike (BBMP), Karnataka State Natural Disaster Monitoring Centre (KSNDMC), Bengaluru Traffic Police (BTP), Urban Commuters.

---

## 1. Executive Summary & Problem Context

Bengaluru, India's high-technology capital, frequently experiences intense convective localized rainfall during pre-monsoon and monsoon seasons. Because of the city's undulating terrain, rapid urbanization, and restricted drainage outfalls, low-lying road corridors, subways, and underpasses are highly susceptible to acute waterlogging.

### The Urban Commuter Problem
- Commercial map and traffic applications often treat an underpass merely as a congested road rather than an impassable hydraulic hazard.
- Commuters frequently discover an inundated subway only after entering the downward grade, resulting in vehicle stalls, severe arterial gridlock, engine hydrostatic lock, and life safety hazards.
- General weather forecasts provide regional rainfall totals but lack underpass-specific clearance depth data.

### The WaveGuard Solution
WaveGuard provides a unified, location-aware digital twin that:
1. Maintains a structured geographical inventory of vulnerable Bengaluru underpasses with verified coordinates and location-specific clearance thresholds.
2. Continuously ingests water depth telemetry, validating measurements against physical plausibility rules.
3. Classifies road states into standardized situational indicators: `NORMAL`, `CAUTION`, `CONFIRMED_BLOCKED`, or `UNKNOWN`.
4. Renders live conditions on an interactive 3D digital twin map powered by MapLibre GL JS and OpenFreeMap vector tiles.
5. Employs a deterministic NetworkX Dijkstra route solver to guide vehicles through safe detours around flooded corridors.
6. Provides an optional Groq-powered AI Copilot grounded directly in database telemetry.

---

## 2. Monitored Demonstration Inventory (Bengaluru Corridors)

WaveGuard tracks 12 critical underpass and arterial bottlenecks documented in BBMP and KSNDMC vulnerability surveys:

| ID | Location Name | Road Corridor | Coordinates | Caution Thresh. | Closure Thresh. |
|---|---|---|---|:---:|:---:|
| `blr-loc-001` | Marathahalli Underpass | Outer Ring Road East (ORR) | 12.9554° N, 77.6983° E | 15.0 cm | 35.0 cm |
| `blr-loc-002` | Silk Board Junction Underpass | Hosur Road / BTM Interchange | 12.9176° N, 77.6226° E | 18.0 cm | 40.0 cm |
| `blr-loc-003` | Hebbal Flyover & Underpass | Bellary Road (NH 44) Gateway | 13.0358° N, 77.5925° E | 20.0 cm | 45.0 cm |
| `blr-loc-004` | Okalipuram 8-Track Underpass | Majestic Railway Station West | 12.9818° N, 77.5684° E | 15.0 cm | 30.0 cm |
| `blr-loc-005` | Domlur Underpass | Old Airport Road / Inner Ring Road | 12.9609° N, 77.6384° E | 15.0 cm | 35.0 cm |
| `blr-loc-006` | Le Meridien Underpass | Sankey Road Railway Underbridge | 12.9912° N, 77.5878° E | 15.0 cm | 35.0 cm |
| `blr-loc-007` | KR Circle Underpass | Vidhana Soudha / Nrupathunga Rd | 12.9739° N, 77.5866° E | 15.0 cm | 30.0 cm |
| `blr-loc-008` | Sony World Junction Low-Point | Koramangala 100ft Road Corridor | 12.9348° N, 77.6271° E | 16.0 cm | 35.0 cm |
| `blr-loc-009` | Bellandur Eco-Space Low-Point | Outer Ring Road IT Corridor | 12.9255° N, 77.6835° E | 20.0 cm | 42.0 cm |
| `blr-loc-010` | Windsor Manor Railway Subway | Sankey Road / Palace Guttahalli | 12.9959° N, 77.5852° E | 15.0 cm | 35.0 cm |
| `blr-loc-011` | Sirsi Circle Ground Underpass | Mysore Road / KR Market Approach | 12.9592° N, 77.5544° E | 18.0 cm | 40.0 cm |
| `blr-loc-012` | Tin Factory Subway & KR Puram | Old Madras Road (OMR) | 13.0006° N, 77.6669° E | 20.0 cm | 45.0 cm |

---

## 3. Implementation Status & Disclosure

To ensure complete academic and technical integrity, WaveGuard clearly delineates what is implemented, simulated, and planned:

### Implemented Features (Operational in Prototype)
- Full-stack React 19 + TypeScript + Vite frontend with Tailwind CSS design system.
- MapLibre GL JS interactive 3D map with building extrusions, pitch, rotation, and status markers.
- Python FastAPI backend with 9 modular REST API routers.
- Persistent SQLite database managed via SQLAlchemy ORM with normalized tables.
- Classification engine with staleness detection (outdated readings become `UNKNOWN`).
- In-memory alert management service with deduplication and acknowledgement workflow.
- NetworkX Dijkstra shortest-path routing algorithm that dynamically avoids `CONFIRMED_BLOCKED` edges.
- Groq AI Assistant integration grounded directly in live database state, with automatic rule-based fallback.
- Automated pytest test suite covering all services with 100% pass rate.

### Simulated Features (Demonstration Data Pipeline)
- Water-depth telemetry pulses (5s interval) across realistic storm scenarios (`MONSOON_SURGE`, `FLASH_FLOOD`, `DRY_WEATHER`).
- Manual reading entry interface for testing threshold transitions on demand.

### Planned Hardware Integration (Future Capstone Phase)
- ESP32-WROOM microcontrollers.
- JSN-SR04T waterproof ultrasonic depth transducers.
- 4G NB-IoT or LoRaWAN field transmission gateways.
