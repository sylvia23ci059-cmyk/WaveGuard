# WAVEGUARD: REST API DOCUMENTATION

Base URL: `http://localhost:8000/api`  
Interactive Swagger UI: `http://localhost:8000/docs`  
Interactive ReDoc: `http://localhost:8000/redoc`

---

## 1. System Health & Metadata

### `GET /api/health`
Checks whether the backend server is operating properly.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "WaveGuard Backend API",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 2. Overview Dashboard

### `GET /api/dashboard/summary`
Retrieves consolidated system metrics, location status distribution, recent telemetry pulses, recent alerts, and simulation state.
- **Response `200 OK`**:
```json
{
  "summary": {
    "total_locations": 12,
    "normal_locations": 9,
    "caution_locations": 2,
    "blocked_locations": 1,
    "unknown_locations": 0
  },
  "distribution": {
    "NORMAL": 9,
    "CAUTION": 2,
    "BLOCKED": 1,
    "UNKNOWN": 0
  },
  "recent_readings": [
    {
      "id": 142,
      "location_id": "blr-loc-001",
      "location_name": "Marathahalli Underpass",
      "water_depth_cm": 22.4,
      "timestamp": "2026-11-16T18:05:00.000Z",
      "source": "SIMULATED",
      "validation_status": "VALID"
    }
  ],
  "recent_alerts": [
    {
      "id": 12,
      "location_id": "blr-loc-002",
      "location_name": "Silk Board Junction Underpass",
      "alert_type": "CONFIRMED_CLOSURE",
      "severity": "CRITICAL",
      "description": "CRITICAL: Road closure at Silk Board Junction Underpass...",
      "timestamp": "2026-11-16T18:04:00.000Z",
      "is_acknowledged": false
    }
  ],
  "last_system_update": "2026-11-16T18:05:00.000Z",
  "simulator": {
    "is_running": true,
    "interval_seconds": 5,
    "readings_generated_count": 348,
    "active_scenario": "MONSOON_SURGE",
    "last_tick_time": "2026-11-16T18:05:00.000Z",
    "data_source_mode": "SIMULATED_DEMO_PIPELINE"
  },
  "data_source_indicator": {
    "mode": "SIMULATED_DEMO_PIPELINE",
    "disclosure": "College Prototype - Simulated Sensor Telemetry (No physical sensors currently deployed)",
    "study_area": "Bengaluru, Karnataka, India"
  }
}
```

---

## 3. Location Management

### `GET /api/locations`
Retrieves monitored locations. Supports filtering.
- **Query Parameters:**
  - `status` (optional): `NORMAL`, `CAUTION`, `BLOCKED`, `UNKNOWN`
  - `category` (optional): `underpass`, `subway`, `arterial_lowpoint`, `intersection`
  - `search` (optional): keyword filter on name or corridor code
- **Response `200 OK`:** Array of `LocationResponse` objects.

### `GET /api/locations/geojson`
Returns all monitored locations as a standard GeoJSON `FeatureCollection` ready for MapLibre layer binding.
- **Response `200 OK`**:
```json
{
  "type": "FeatureCollection",
  "metadata": {
    "city": "Bengaluru, Karnataka, India",
    "total_features": 12
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [77.6983, 12.9554]
      },
      "properties": {
        "id": "blr-loc-001",
        "name": "Marathahalli Underpass",
        "category": "underpass",
        "caution_threshold_cm": 15.0,
        "closure_threshold_cm": 35.0,
        "current_status": "CAUTION",
        "current_water_depth_cm": 22.4
      }
    }
  ]
}
```

### `POST /api/locations`
Registers a new monitored underpass or roadway site.
- **Request Body:**
```json
{
  "id": "blr-loc-013",
  "name": "Richmond Circle Underpass",
  "description": "Double-lane flyover underpass near Residency Road",
  "latitude": 12.9665,
  "longitude": 77.5992,
  "category": "underpass",
  "road_identifier": "CBD-RC-UP08",
  "caution_threshold_cm": 15.0,
  "closure_threshold_cm": 35.0,
  "is_active": true
}
```
- **Response `201 Created`**: The created `LocationResponse` object.

### `PUT /api/locations/{id}`
Updates coordinates, name, or location-specific thresholds.
- **Response `200 OK`**: Updated object.

### `DELETE /api/locations/{id}`
Deletes a location and associated cascade data.
- **Response `200 OK`**: `{"success": true, "message": "Location deleted successfully"}`

---

## 4. Water Telemetry Readings

### `GET /api/readings`
Returns historical depth measurements.
- **Query Parameters:** `location_id` (optional), `limit` (default: 50).

### `POST /api/readings`
Ingests a single water-level reading, triggers validation, executes classification, updates road segment state, and checks alert rules.
- **Request Body:**
```json
{
  "location_id": "blr-loc-001",
  "water_depth_cm": 38.5,
  "source": "SIMULATED"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "reading_id": 182,
  "location_id": "blr-loc-001",
  "location_name": "Marathahalli Underpass",
  "water_depth_cm": 38.5,
  "status": "BLOCKED",
  "previous_status": "CAUTION",
  "reason": "Critical inundation (38.5 cm >= 35.0 cm closure threshold). Road segment impassable.",
  "alert_created": true
}
```

---

## 5. Alerts & Incidents

### `GET /api/alerts`
Retrieves system alerts.
- **Query Parameters:** `acknowledged` (boolean), `severity` (`INFO`, `WARNING`, `CRITICAL`), `limit` (int).

### `POST /api/alerts/{id}/acknowledge`
Marks an alert as acknowledged by an operator.
- **Request Body:** `{"acknowledged_by": "Traffic Officer Kumar"}`
- **Response `200 OK`**: Updated alert object.

---

## 6. Route Guidance & Detour Calculation

### `GET /api/routes/graph`
Returns topological nodes and edges for Bengaluru corridors.

### `POST /api/routes/calculate`
Calculates shortest path using NetworkX Dijkstra algorithm.
- **Request Body:**
```json
{
  "origin_node_id": "node-domlur",
  "destination_node_id": "node-silk-board",
  "avoid_blocked": true
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "path_nodes": ["node-domlur", "node-koramangala", "node-silk-board"],
  "total_distance_km": 6.4,
  "segments": [...],
  "blocked_segments_avoided": [
    {
      "edge_id": "edge-marathahalli-bellandur",
      "location_name": "Marathahalli Underpass",
      "water_depth_cm": 42.0
    }
  ],
  "is_safe": true,
  "explanation": "Calculated safe corridor from Domlur Flyover & Underpass to Central Silk Board Junction (6.4 km). Corridor sequence: Inner Ring Road (IRR Ejipura) → Koramangala 100ft Road to Hosur Road. SAFELY DETOURED around 1 confirmed blocked segment(s): Marathahalli Underpass (42.0 cm).",
  "geometry_geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "disclaimer": "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"
}
```

---

## 7. Telemetry Simulator

### `GET /api/simulator/status`
Returns active status, interval, scenario, and readings count.

### `POST /api/simulator/start`
Starts the background periodic simulator loop.

### `POST /api/simulator/stop`
Pauses the background loop.

### `POST /api/simulator/step`
Manually triggers 1 simulation cycle.

### `POST /api/simulator/scenario`
Switches active storm scenario: `DRY_WEATHER`, `LIGHT_SHOWERS`, `MONSOON_SURGE`, `FLASH_FLOOD`, `RECEDING`.

### `POST /api/simulator/reset`
Restores database to baseline normal state.

---

## 8. Data-Grounded AI Copilot

### `POST /api/ai/chat`
Consults the AI Copilot. Uses live database context to answer queries.
- **Request Body:**
```json
{
  "query": "Which locations in Bengaluru are currently blocked?",
  "conversation_history": []
}
```
- **Response `200 OK`**:
```json
{
  "response": "According to live WaveGuard database telemetry, there is currently 1 confirmed blocked location:\n\n- **Silk Board Junction Underpass** (HSR-ORR-UP02): Water depth is 42.0 cm, exceeding its 40.0 cm closure threshold.\n\nSafe Route Guidance has detoured traffic corridors around this segment.",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "grounding_data": {
    "total_monitored_locations": 12,
    "normal_count": 9,
    "caution_count": 2,
    "blocked_count": 1,
    "unknown_count": 0
  }
}
```
