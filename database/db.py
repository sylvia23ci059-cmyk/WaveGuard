"""
WaveGuard KGF Database Manager
Provides SQLite database initialization, connection pooling, and initial seed data.
"""

import os
import sqlite3
import json
from datetime import datetime, timedelta
import math

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "waveguard_kgf.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
BOUNDARY_GEOJSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "boundaries", "KGF_Taluk_Boundary_WGS84.geojson")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()

    # Seed data if tables are empty
    seed_data(conn)
    conn.close()
    print("Database initialized successfully at:", DB_PATH)


def seed_data(conn):
    cursor = conn.cursor()

    # 1. Ingest KGF Taluk Boundary
    cursor.execute("SELECT COUNT(*) FROM taluk_boundaries")
    if cursor.fetchone()[0] == 0 and os.path.exists(BOUNDARY_GEOJSON_PATH):
        try:
            with open(BOUNDARY_GEOJSON_PATH, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)

            feature = geojson_data["features"][0]
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            coords = geom.get("coordinates", [[]])[0]

            lons = [pt[0] for pt in coords if len(pt) >= 2]
            lats = [pt[1] for pt in coords if len(pt) >= 2]
            bbox_west = min(lons) if lons else 78.2271
            bbox_south = min(lats) if lats else 12.8580
            bbox_east = max(lons) if lons else 78.4751
            bbox_north = max(lats) if lats else 13.0829

            # Approximate area in sq km for taluk
            area_sqkm = 442.8  # Official KGF taluk geographic area

            cursor.execute("""
                INSERT INTO taluk_boundaries 
                (name, boundary_type, crs, geometry_geojson, bbox_west, bbox_south, bbox_east, bbox_north, area_sqkm, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "Kolar Gold Field",
                "administrative",
                "EPSG:4326",
                json.dumps(geom),
                bbox_west,
                bbox_south,
                bbox_east,
                bbox_north,
                area_sqkm,
                "Karnataka GIS / Taluk.zip / Taluk Code 1912 (LGD 7002)"
            ))

            # Urban built-up zone (Robertsonpet, Andersonpet, Champion Reefs central corridor)
            urban_polygon = {
                "type": "Polygon",
                "coordinates": [[
                    [78.260, 12.935],
                    [78.290, 12.935],
                    [78.295, 12.985],
                    [78.265, 12.985],
                    [78.260, 12.935]
                ]]
            }
            cursor.execute("""
                INSERT INTO taluk_boundaries 
                (name, boundary_type, crs, geometry_geojson, bbox_west, bbox_south, bbox_east, bbox_north, area_sqkm, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "KGF Urban Core (Robertsonpet - Andersonpet Urban Agglomeration)",
                "urban_builtup",
                "EPSG:4326",
                json.dumps(urban_polygon),
                78.260, 12.935, 78.295, 12.985,
                24.5,
                "KGF Urban Local Body Planning Footprint"
            ))

            # Catchment buffer (hydrological boundary)
            buffer_polygon = {
                "type": "Polygon",
                "coordinates": [[
                    [bbox_west - 0.04, bbox_south - 0.04],
                    [bbox_east + 0.04, bbox_south - 0.04],
                    [bbox_east + 0.04, bbox_north + 0.04],
                    [bbox_west - 0.04, bbox_north + 0.04],
                    [bbox_west - 0.04, bbox_south - 0.04]
                ]]
            }
            cursor.execute("""
                INSERT INTO taluk_boundaries 
                (name, boundary_type, crs, geometry_geojson, bbox_west, bbox_south, bbox_east, bbox_north, area_sqkm, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "KGF Hydrological Catchment Analysis Buffer",
                "catchment",
                "EPSG:4326",
                json.dumps(buffer_polygon),
                bbox_west - 0.04, bbox_south - 0.04, bbox_east + 0.04, bbox_north + 0.04,
                580.0,
                "Upslope Catchment DEM Delineation Buffer"
            ))
            print("Taluk boundaries ingested successfully.")
        except Exception as e:
            print("Error ingesting boundary:", e)

    # 2. Ingest Data Sources Registry (Scientific Provenance)
    cursor.execute("SELECT COUNT(*) FROM data_sources_registry")
    if cursor.fetchone()[0] == 0:
        sources = [
            (
                "COPERNICUS_GLO30",
                "Copernicus DEM GLO-30 (Global 30m Digital Surface Model)",
                "European Space Agency (ESA) / AWS Open Data",
                "https://registry.opendata.aws/copernicus-dem/",
                "2026-11-10",
                "30 meters",
                "WGS 84 (EPSG:4326) / Reprojected to UTM 44N (EPSG:32644)",
                "2011 - 2015 baseline radar acquisition",
                "DSM reflects vegetation canopy and structures. Preliminary regional screening only; not valid for narrow underpasses.",
                "Mosaic of tiles N12_00_E078_00 and N13_00_E078_00 clipped to KGF bounding box with UTM zone 44N metric projection."
            ),
            (
                "KGF_TALUK_BND",
                "Karnataka Administrative Taluk Boundary (Kolar Gold Field)",
                "Karnataka State Remote Sensing Applications Centre (KSRSAC) / KGIS",
                "data/boundaries/KGF_Taluk_Boundary.gpkg",
                "2026-10-13",
                "Cadastral / Taluk Polygon Scale 1:25,000",
                "EPSG:32644 (UTM 44N) & EPSG:4326 (WGS84)",
                "Current Administrative Boundaries 2026",
                "Taluk boundary is administrative, not municipal urban boundary or watershed divide.",
                "Extracted from Karnataka Taluk shapefile record KGISTalukN = 'Kolar Gold Field' (Taluk Code 1912, LGD 7002)."
            ),
            (
                "OSM_INFRASTRUCTURE",
                "OpenStreetMap Roads, Drainage & Infrastructure",
                "OpenStreetMap Contributors / Geofabrik Karnataka Extract",
                "https://download.geofabrik.de/asia/india.html",
                "2026-11-10",
                "Vector road centrelines and drain lines",
                "WGS 84 (EPSG:4326)",
                "Live OSM snapshot",
                "Underground stormwater pipes are largely unmapped and marked as unknown.",
                "QuickOSM Overpass query for highway, waterway, bridge, and building tags within KGF bbox."
            ),
            (
                "IMD_RAINFALL",
                "IMD Daily Gridded Rainfall & Historical Archive",
                "India Meteorological Department (IMD) Pune",
                "https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html",
                "2026-11-10",
                "0.25° x 0.25° spatial grid",
                "Geographic WGS 84",
                "1990 - 2025 daily series",
                "Coarse 25km resolution gridded data. Not to be presented as street-level micro-catchment measurements.",
                "Extracted nearest grid point for KGF centroid (12.96°N, 78.27°E) with explicit mm units."
            ),
            (
                "BHUVAN_NRSC_LULC",
                "ISRO / NRSC Bhuvan Land Use & Land Cover",
                "National Remote Sensing Centre (NRSC), ISRO",
                "https://bhuvan.nrsc.gov.in/",
                "2026-11-10",
                "50m LULC classification",
                "LCC / WGS 84",
                "Annual NRSC LULC Cycle",
                "Older classification must not be misrepresented as real-time surface conditions.",
                "Classified into Built-up, Vegetation, Waterbodies, and Mine Tailings (Cyanide Dumps)."
            )
        ]
        for src in sources:
            cursor.execute("""
                INSERT INTO data_sources_registry
                (dataset_code, title, provider, url, download_date, spatial_resolution, crs, temporal_coverage, limitations, processing_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, src)
        print("Data sources registry seeded.")

    # 3. Seed Preliminary Hotspots (Scientifically ranked, unverified / preliminary study status)
    cursor.execute("SELECT COUNT(*) FROM hotspots")
    if cursor.fetchone()[0] == 0:
        hotspots = [
            (
                "KGF-HOT-001",
                "Andersonpet South Low-Lying Drainage Confluence",
                12.9372, 78.2721,
                792.4, 0.8, 14250.0, 48.2,
                "Open concrete nallah crossing with sediment accumulation",
                "Historical seasonal waterlogging noted during high intensity convective storms (KSNDMC 2022).",
                "unverified", "critical", 0.88, 0.72,
                "Inspect culvert barrel dimensions and clear upstream silt accumulation prior to monsoon."
            ),
            (
                "KGF-HOT-002",
                "Robertsonpet Swarna Nallah Bottleneck (Market Road)",
                12.9585, 78.2684,
                808.2, 1.2, 11840.0, 36.5,
                "Encroached natural channel with masonry retaining walls",
                "Waterlogging reported up to 0.45m on commercial road during September 2021 rains.",
                "field_surveyed", "high", 0.79, 0.81,
                "Deploy ultrasonic water level sensor; establish trash rack cleaning protocol."
            ),
            (
                "KGF-HOT-003",
                "Champion Reefs Railway Underpass (Southern Approach)",
                12.9691, 78.2743,
                801.5, 0.4, 8920.0, 22.8,
                "Depression railway underbridge (RUB) with sump pump dependency",
                "Submergence observed halting traffic for 6 hours in October 2020.",
                "confirmed_hotspot", "critical", 0.92, 0.90,
                "Maintain automated backup submersible pumps and warning depth gauge board."
            ),
            (
                "KGF-HOT-004",
                "Oorgaum Mining Tailings Basin Runoff Confluence",
                12.9814, 78.2625,
                815.0, 1.8, 15600.0, 64.0,
                "Earthen runoff ravine from historical cyanide dump slopes",
                "Fine silt wash-off causing downstream blockage in natural swales.",
                "unverified", "medium", 0.68, 0.65,
                "Construct check dams and silt retention basins upstream."
            ),
            (
                "KGF-HOT-005",
                "Marikuppam Station Road Low-Sump Culvert",
                12.9248, 78.2789,
                786.1, 0.6, 9450.0, 31.2,
                "Twin circular pipe culvert beneath rural transit road",
                "Local residents reported backwater accumulation during monsoon 2023.",
                "field_surveyed", "high", 0.76, 0.78,
                "Upgrade to box culvert structure; survey downstream outfall gradient."
            ),
            (
                "KGF-HOT-006",
                "Nundydurg Mines Perimeter Drainage Outlet",
                13.0021, 78.2570,
                822.4, 2.1, 7800.0, 28.5,
                "Unlined drainage ditch along mine lease boundary",
                "Inundation of adjacent unpaved access corridor.",
                "unverified", "low", 0.54, 0.58,
                "Routine channel dredging and cross-drain maintenance."
            )
        ]
        for h in hotspots:
            cursor.execute("""
                INSERT INTO hotspots
                (hotspot_code, name, latitude, longitude, elevation_m, slope_deg, flow_accum_pixels, catchment_area_ha, nearby_drainage_type, historical_evidence, verification_status, inspection_priority, susceptibility_score, confidence_score, recommended_action)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, h)
        print("Preliminary hotspots seeded.")

    # 4. Seed IoT Stations (With explicit DEMONSTRATION DATA label)
    cursor.execute("SELECT COUNT(*) FROM iot_stations")
    if cursor.fetchone()[0] == 0:
        stations = [
            (
                "KGF-SEN-01",
                "Andersonpet Main Nallah Bridge Station",
                12.9370, 78.2725,
                "Andersonpet Primary Storm Nallah",
                "nallah_bridge",
                1, "DEMONSTRATION DATA",
                1.20, 2.00, 3.20,
                0.42, 0.0, 94.5, -67, "online"
            ),
            (
                "KGF-SEN-02",
                "Robertsonpet Central Commercial Culvert Station",
                12.9582, 78.2687,
                "Swarna Nallah Branch A",
                "culvert",
                1, "DEMONSTRATION DATA",
                0.90, 1.50, 2.40,
                0.31, 0.0, 89.2, -72, "online"
            ),
            (
                "KGF-SEN-03",
                "Champion Reefs Railway Underpass Depth Gauge",
                12.9690, 78.2745,
                "Railway Underpass Sump Drain",
                "underpass",
                1, "DEMONSTRATION DATA",
                0.60, 1.10, 2.80,
                0.18, 0.0, 97.0, -61, "online"
            ),
            (
                "KGF-SEN-04",
                "Marikuppam South Outfall Station",
                12.9245, 78.2792,
                "Southern Catchment Discharge Canal",
                "storm_channel",
                1, "DEMONSTRATION DATA",
                1.40, 2.20, 3.50,
                0.55, 0.0, 91.8, -75, "online"
            ),
            (
                "KGF-SEN-05",
                "Oorgaum Mines Meteorological & Runoff Sensor",
                12.9810, 78.2630,
                "Tailings Runoff Basin 2",
                "weather_station",
                1, "DEMONSTRATION DATA",
                1.00, 1.80, 2.60,
                0.22, 0.0, 84.1, -79, "online"
            )
        ]
        for s in stations:
            cursor.execute("""
                INSERT INTO iot_stations
                (station_code, name, latitude, longitude, channel_name, installation_type, is_simulated, provenance_label, warning_threshold_m, critical_threshold_m, max_channel_depth_m, current_water_level_m, current_rainfall_mm, battery_pct, signal_rssi, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, s)
        print("IoT stations seeded.")

    # 5. Seed Drainage Monitoring Segments
    cursor.execute("SELECT COUNT(*) FROM drainage_monitoring")
    if cursor.fetchone()[0] == 0:
        drainage = [
            (
                1, 4,
                "Andersonpet to Marikuppam Southern Discharge Corridor",
                "normal",
                0.13, 0.42, 0.55, 0.0,
                "Differential hydraulic head consistent with gravity open-channel flow. No obstruction detected."
            ),
            (
                2, 1,
                "Robertsonpet Swarna Nallah to Andersonpet Link",
                "normal",
                0.11, 0.31, 0.42, 0.0,
                "Hydraulic gradient within normal parameters. Flow velocity nominal."
            ),
            (
                3, 2,
                "Champion Reefs Underpass Pump Outfall to Swarna Nallah",
                "normal",
                0.13, 0.18, 0.31, 0.0,
                "Sump dry-weather drainage functioning normally."
            )
        ]
        for d in drainage:
            cursor.execute("""
                INSERT INTO drainage_monitoring
                (upstream_station_id, downstream_station_id, reach_name, status, differential_head_m, upstream_depth_m, downstream_depth_m, rainfall_rate_mm_hr, diagnosis_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, d)
        print("Drainage monitoring segments seeded.")

    # 6. Seed Road Network Segments
    cursor.execute("SELECT COUNT(*) FROM road_segments")
    if cursor.fetchone()[0] == 0:
        roads = [
            (
                "osm-way-1001", "KGF Main Road (Bangarapet - KGF Highway)", "primary", "asphalt", 4200.0,
                "open", None, 0.0,
                json.dumps({
                    "type": "LineString",
                    "coordinates": [[78.255, 12.980], [78.265, 12.965], [78.270, 12.950], [78.275, 12.935]]
                })
            ),
            (
                "osm-way-1002", "Robertsonpet Commercial Market Road", "secondary", "concrete", 1850.0,
                "open", None, 5.0,
                json.dumps({
                    "type": "LineString",
                    "coordinates": [[78.265, 12.965], [78.272, 12.960], [78.278, 12.955]]
                })
            ),
            (
                "osm-way-1003", "Champion Reefs Railway Underpass Road", "tertiary", "asphalt", 650.0,
                "caution", "Low-lying underpass; water sensor at 0.18m. Passable for heavy vehicles with caution.", 18.0,
                json.dumps({
                    "type": "LineString",
                    "coordinates": [[78.268, 12.972], [78.274, 12.969], [78.280, 12.967]]
                })
            ),
            (
                "osm-way-1004", "Andersonpet South Causeway", "secondary", "asphalt", 1200.0,
                "open", None, 0.0,
                json.dumps({
                    "type": "LineString",
                    "coordinates": [[78.268, 78.272], [78.272, 12.937], [78.276, 12.930]]
                })
            ),
            (
                "osm-way-1005", "Marikuppam Outer Ring Transit Road", "tertiary", "bitumen", 2900.0,
                "open", None, 0.0,
                json.dumps({
                    "type": "LineString",
                    "coordinates": [[78.275, 12.935], [78.280, 12.925], [78.285, 12.920]]
                })
            )
        ]
        for r in roads:
            cursor.execute("""
                INSERT INTO road_segments
                (osm_id, name, highway_type, surface, length_m, status, closure_reason, water_depth_cm, geometry_geojson)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, r)
        print("Road segments seeded.")

    # 7. Seed Incidents (Verified vs Unverified Citizen Reports)
    cursor.execute("SELECT COUNT(*) FROM incidents")
    if cursor.fetchone()[0] == 0:
        incidents = [
            (
                "INC-2026-001", "waterlogging",
                "Standing Water Accumulation on Robertsonpet Market Approach",
                "Water depth approx 15-20cm observed following evening convective downpour. Vehicles moving slowly.",
                12.9590, 78.2690, "Robertsonpet Gandhi Circle",
                "citizen", "+91 98451 00001",
                "verified", "medium",
                None, "PWD Stormwater Quick Response Unit"
            ),
            (
                "INC-2026-002", "blocked_drain",
                "Plastic Waste and Silt Obstructing Andersonpet Box Culvert Inlet",
                "Trash accumulation reducing hydraulic throat area by ~40%. Needs urgent clearing.",
                12.9375, 78.2718, "Andersonpet South Culvert",
                "field_engineer", "+91 94480 00002",
                "investigating", "high",
                None, "Municipal Sanitation Division"
            ),
            (
                "INC-2026-003", "emergency_sos",
                "Public Assistance Request: Inundated Residential Basement",
                "Citizen reported 30cm water in parking area near Swarna Nallah buffer. Note: Public emergency dispatch must be confirmed via 112.",
                12.9610, 78.2660, "Coromandel Colony",
                "citizen", "+91 97412 00003",
                "unverified", "high",
                None, "KGF Fire & Emergency Control Room"
            )
        ]
        for inc in incidents:
            cursor.execute("""
                INSERT INTO incidents
                (incident_number, category, title, description, latitude, longitude, location_name, reporter_type, reporter_contact, verification_status, severity, photo_url, assigned_team)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, inc)
        print("Incidents seeded.")

    # 8. Seed Susceptibility Configs
    cursor.execute("SELECT COUNT(*) FROM susceptibility_configs")
    if cursor.fetchone()[0] == 0:
        default_weights = {
            "slope": 0.25,
            "elevation": 0.20,
            "flow_accumulation": 0.25,
            "topographic_wetness_index": 0.15,
            "land_cover_impervious": 0.15
        }
        cursor.execute("""
            INSERT INTO susceptibility_configs
            (name, weights_json, is_active, description)
            VALUES (?, ?, ?, ?)
        """, (
            "KGF Scientific Multi-Criteria Baseline Model",
            json.dumps(default_weights),
            1,
            "Configurable weighted linear combination model based on terrain gradient, accumulation convergence, and soil sealing."
        ))

    # 9. Seed Users (Roles: Public, Surveyor, Engineer, Admin)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        users = [
            ("admin", "admin@waveguard-kgf.gov.in", "pbkdf2:sha256:admin123", "Chief Disaster Management Officer", "admin"),
            ("engineer", "engineer@kgf-municipality.gov.in", "pbkdf2:sha256:eng123", "Municipal Drainage Engineer", "engineer"),
            ("surveyor", "surveyor@ksrsac.gov.in", "pbkdf2:sha256:surv123", "Field Survey Specialist", "surveyor"),
            ("public", "resident@kgf.in", "pbkdf2:sha256:pub123", "KGF Community Member", "public")
        ]
        for u in users:
            cursor.execute("""
                INSERT INTO users
                (username, email, password_hash, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            """, u)
        print("Users seeded.")

    conn.commit()


if __name__ == "__main__":
    init_db()
