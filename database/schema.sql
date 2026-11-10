-- WaveGuard KGF Database Schema
-- Compatible with SQLite and PostgreSQL / PostGIS

CREATE TABLE IF NOT EXISTS taluk_boundaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    boundary_type TEXT NOT NULL DEFAULT 'administrative', -- administrative, urban_builtup, catchment, analysis_buffer
    crs TEXT NOT NULL DEFAULT 'EPSG:4326',
    geometry_geojson TEXT NOT NULL,
    bbox_west REAL,
    bbox_south REAL,
    bbox_east REAL,
    bbox_north REAL,
    area_sqkm REAL,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dem_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layer_type TEXT NOT NULL, -- elevation, slope, hillshade, flow_accumulation, twi, depressions
    file_path TEXT,
    grid_width INTEGER,
    grid_height INTEGER,
    cell_size_m REAL,
    min_value REAL,
    max_value REAL,
    mean_value REAL,
    unit TEXT,
    crs TEXT DEFAULT 'EPSG:32644',
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotspot_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    elevation_m REAL,
    slope_deg REAL,
    flow_accum_pixels REAL,
    catchment_area_ha REAL,
    nearby_drainage_type TEXT,
    historical_evidence TEXT,
    verification_status TEXT DEFAULT 'unverified', -- unverified, field_surveyed, confirmed_hotspot, rejected
    inspection_priority TEXT DEFAULT 'medium',    -- critical, high, medium, low
    susceptibility_score REAL DEFAULT 0.0,
    confidence_score REAL DEFAULT 0.5,
    recommended_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iot_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    channel_name TEXT,
    installation_type TEXT DEFAULT 'culvert', -- nallah_bridge, culvert, underpass, storm_channel, weather_station
    is_simulated INTEGER DEFAULT 1,
    provenance_label TEXT DEFAULT 'DEMONSTRATION DATA',
    warning_threshold_m REAL DEFAULT 1.2,
    critical_threshold_m REAL DEFAULT 2.0,
    max_channel_depth_m REAL DEFAULT 3.0,
    current_water_level_m REAL DEFAULT 0.35,
    current_rainfall_mm REAL DEFAULT 0.0,
    battery_pct REAL DEFAULT 94.0,
    signal_rssi INTEGER DEFAULT -68,
    status TEXT DEFAULT 'online', -- online, warning, critical, offline, maintenance
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES iot_stations(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    water_level_m REAL NOT NULL,
    rate_of_rise_m_hr REAL DEFAULT 0.0,
    rainfall_last_hr_mm REAL DEFAULT 0.0,
    battery_voltage REAL DEFAULT 3.95,
    rssi_dbm INTEGER DEFAULT -70,
    is_simulated INTEGER DEFAULT 1,
    raw_payload TEXT
);

CREATE TABLE IF NOT EXISTS drainage_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upstream_station_id INTEGER REFERENCES iot_stations(id),
    downstream_station_id INTEGER REFERENCES iot_stations(id),
    reach_name TEXT NOT NULL,
    status TEXT DEFAULT 'normal', -- normal, rising_water, possible_restriction, possible_overflow, sensor_fault, insufficient_information
    differential_head_m REAL DEFAULT 0.0,
    upstream_depth_m REAL,
    downstream_depth_m REAL,
    rainfall_rate_mm_hr REAL,
    diagnosis_notes TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- waterlogging, blocked_drain, road_impassable, infrastructure_damage, emergency_sos
    title TEXT NOT NULL,
    description TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    location_name TEXT,
    reporter_type TEXT DEFAULT 'citizen', -- citizen, field_engineer, sensor_automated
    reporter_contact TEXT,
    verification_status TEXT DEFAULT 'unverified', -- unverified, investigating, verified, resolved, false_alarm
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    photo_url TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    assigned_team TEXT
);

CREATE TABLE IF NOT EXISTS road_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osm_id TEXT,
    name TEXT NOT NULL,
    highway_type TEXT DEFAULT 'secondary',
    surface TEXT DEFAULT 'asphalt',
    length_m REAL,
    status TEXT DEFAULT 'open', -- open, caution, waterlogged, closed
    closure_reason TEXT,
    water_depth_cm REAL DEFAULT 0.0,
    geometry_geojson TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rainfall_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT NOT NULL,
    observation_time TIMESTAMP NOT NULL,
    rainfall_mm REAL NOT NULL,
    interval_type TEXT DEFAULT 'hourly', -- hourly, daily, 15_min
    data_source TEXT NOT NULL,          -- IMD, KSNDMC, Live_Weather_API, ESP32_Local
    is_interpolated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS susceptibility_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    weights_json TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_sources_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    url TEXT,
    download_date DATE,
    spatial_resolution TEXT,
    crs TEXT,
    temporal_coverage TEXT,
    limitations TEXT,
    processing_history TEXT,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'public', -- public, surveyor, engineer, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
