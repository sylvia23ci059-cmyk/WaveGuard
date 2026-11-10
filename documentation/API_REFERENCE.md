# WaveGuard KGF: REST & WebSocket API Reference
**3D Urban Flood Intelligence & Situational Awareness Platform**

Base REST URL: `http://localhost:8000/api`  
WebSocket Stream: `ws://localhost:8000/ws/telemetry`

---

## 1. Administrative Boundaries API

### `GET /api/boundaries/kgf`
Returns the verified administrative KGF Taluk polygon GeoJSON with bounding box, area, and centroid.

**Response (200 OK):**
```json
{
  "type": "Feature",
  "properties": {
    "name": "Kolar Gold Field",
    "boundary_type": "administrative",
    "crs": "EPSG:4326",
    "area_sqkm": 442.8,
    "source": "Karnataka GIS / Taluk.zip / Taluk Code 1912 (LGD 7002)",
    "bbox": { "west": 78.2271, "south": 12.8580, "east": 78.4751, "north": 13.0829 },
    "centroid": { "latitude": 12.965, "longitude": 78.272 }
  },
  "geometry": { "type": "Polygon", "coordinates": [[[78.288, 13.082], "..."]] }
}
```

### `GET /api/boundaries/layers`
Returns all analytical spatial layers: Administrative Taluk Boundary, Urban Agglomeration Footprint, and Hydrological Catchment Buffer.

---

## 2. Terrain & Hydrological Processing API

### `GET /api/terrain/products`
Lists all generated raster products (Elevation, Slope in degrees, Hillshade, D8 Flow Accumulation, Depressions, TWI, Susceptibility) with summary statistics (min, max, mean, units).

### `GET /api/terrain/sample?lat={float}&lon={float}`
Scientific probe endpoint: interpolates elevation, slope in degrees, upslope accumulation cells, TWI, and susceptibility index at any GPS point within KGF.

**Response (200 OK):**
```json
{
  "in_study_area": true,
  "coordinates": { "latitude": 12.9585, "longitude": 78.2684 },
  "elevation_m": 808.2,
  "slope_degrees": 1.2,
  "flow_accumulation_cells": 11840.0,
  "catchment_area_upstream_ha": 106.56,
  "topographic_wetness_index": 9.42,
  "flood_susceptibility_score": 0.792,
  "susceptibility_category": "Very High Susceptibility",
  "scientific_disclaimer": "Copernicus GLO-30 DSM baseline. Reflects topographical tendency to accumulate runoff; not a dynamic hydrodynamic flood forecast."
}
```

### `GET /api/terrain/drainage`
Returns the extracted natural overland drainage flow pathways as a GeoJSON FeatureCollection of LineStrings with Strahler order.

### `POST /api/gis/recalculate`
Executes an end-to-end rerun of the scientific GIS analysis pipeline.

---

## 3. Flood Susceptibility Model API

### `GET /api/susceptibility/config`
Returns active multi-criteria evaluation (MCE) weights and model description.

### `POST /api/susceptibility/calculate`
Recalculates the multi-factor weighted linear combination model with user-provided weights.

**Request Body:**
```json
{
  "slope": 0.25,
  "elevation": 0.20,
  "flow_accumulation": 0.25,
  "twi": 0.15,
  "impervious": 0.15
}
```

---

## 4. Hotspots Inventory API

### `GET /api/hotspots`
Returns all candidate flood hotspots ordered by susceptibility score with inspection priority, coordinates, elevation, slope, and field verification status.

### `PATCH /api/hotspots/{id}`
Updates the ground-truthing verification status (`unverified`, `field_surveyed`, `confirmed_hotspot`, `rejected`), inspection priority, and recommended mitigation actions.

---

## 5. IoT Sensor Fleet API

### `GET /api/sensors`
Returns real-time telemetry from all monitoring stations with explicit `provenance_label: "DEMONSTRATION DATA"`.

### `GET /api/sensors/{id}/history`
Returns a 24-hour time series of water levels, rainfall, battery voltage, and warning/critical thresholds.

### `POST /api/sensors/simulate-step?scenario={scenario}`
Advances simulated sensor readings for live testing (`convective_storm`, `drainage_subsidence`, `normal_baseflow`) and broadcasts updates over WebSockets.

---

## 6. Drainage Differential Intelligence API

### `GET /api/drainage/segments`
Compares upstream vs downstream hydraulic head stages across reaches and identifies possible restriction or overflow risks based on hydraulic differential heuristics.

---

## 7. Incidents & Citizen SOS API

### `GET /api/incidents`
Returns active citizen reports and emergency SOS requests.

### `POST /api/incidents`
Submits a citizen report. Public submissions are initially labelled `unverified` and carry explicit instructions to dial 112 for immediate emergencies.

### `PATCH /api/incidents/{id}/verify`
Authority endpoint for municipal officers to verify, investigate, or resolve citizen reports.

---

## 8. Road Safety & Rerouting API

### `GET /api/roads`
Returns arterial road network segments with status (`open`, `caution`, `waterlogged`, `closed`) and current water depth in cm.

### `POST /api/roads/route`
Computes a safe driving path between two GPS coordinates in KGF, actively avoiding flooded road segments and low-lying railway underpasses.

### `PATCH /api/roads/{id}/status`
Authority endpoint to toggle road closures or reopenings with water depth logging.

---

## 9. Live WebSocket Feed

### `WS /ws/telemetry`
Real-time bidirectional WebSocket stream:
- **Client receives:**
  - `SENSOR_TELEMETRY_UPDATE`
  - `NEW_INCIDENT_REPORTED`
  - `ROAD_STATUS_CHANGE`
- **Client sends:**
  - Heartbeat pings (`{"type": "PING"}`)
