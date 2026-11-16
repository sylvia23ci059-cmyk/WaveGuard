import json
import logging
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.location import Location
from app.models.sensor import Sensor
from app.models.road_segment import RoadSegment
from app.models.reading import WaterReading
from app.services.classification import classify_waterlogging

logger = logging.getLogger(__name__)

SAMPLE_LOCATIONS_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "sample_locations.geojson"
DEMO_GRAPH_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "demo_road_graph" / "bengaluru_corridors.json"

def seed_initial_data(db: Session, force_reseed: bool = False):
    """
    Seeds initial demonstration locations, sensors, and road network segments into the database.
    """
    loc_count = db.query(Location).count()
    if loc_count > 0 and not force_reseed:
        logger.info(f"Database already contains {loc_count} locations. Skipping seed.")
        return

    logger.info("Seeding initial Bengaluru vulnerable underpass locations...")
    
    if not SAMPLE_LOCATIONS_FILE.exists():
        logger.error(f"Sample locations file not found at {SAMPLE_LOCATIONS_FILE}")
        return

    with open(SAMPLE_LOCATIONS_FILE, "r", encoding="utf-8") as f:
        geojson = json.load(f)

    now = datetime.utcnow()

    # Initial baseline scenario depths for a realistic first launch
    # Marathahalli is at CAUTION (22 cm), Silk Board is at BLOCKED (42 cm), others NORMAL
    initial_depth_map = {
        "blr-loc-001": 22.0,  # Marathahalli: Caution
        "blr-loc-002": 42.0,  # Silk Board: Blocked
        "blr-loc-003": 8.0,   # Hebbal: Normal
        "blr-loc-004": 6.5,   # Okalipuram: Normal
        "blr-loc-005": 18.0,  # Domlur: Caution
        "blr-loc-006": 5.0,   # Le Meridien: Normal
        "blr-loc-007": 4.5,   # KR Circle: Normal
        "blr-loc-008": 7.0,   # Sony World: Normal
        "blr-loc-009": 12.0,  # Bellandur: Normal
        "blr-loc-010": 5.5,   # Windsor Manor: Normal
        "blr-loc-011": 6.0,   # Sirsi Circle: Normal
        "blr-loc-012": 9.0    # Tin Factory: Normal
    }

    for feat in geojson.get("features", []):
        props = feat["properties"]
        geom = feat["geometry"]
        lng, lat = geom["coordinates"]
        loc_id = props["id"]

        init_depth = initial_depth_map.get(loc_id, 4.0)
        caution_th = props.get("caution_threshold_cm", 15.0)
        closure_th = props.get("closure_threshold_cm", 35.0)

        status, reason, _ = classify_waterlogging(
            water_depth_cm=init_depth,
            caution_threshold_cm=caution_th,
            closure_threshold_cm=closure_th,
            reading_time=now
        )

        location = Location(
            id=loc_id,
            name=props["name"],
            description=props.get("description", ""),
            latitude=lat,
            longitude=lng,
            category=props.get("category", "underpass"),
            road_identifier=props.get("road_identifier", ""),
            caution_threshold_cm=caution_th,
            closure_threshold_cm=closure_th,
            is_active=props.get("is_active", True),
            verification_status=props.get("verification_status", "DEMONSTRATION_VERIFIED"),
            source_info=props.get("source", "OpenStreetMap & BBMP Flood Survey"),
            current_status=status,
            current_water_depth_cm=init_depth,
            last_reading_time=now,
            created_at=now,
            updated_at=now
        )
        db.add(location)

        # Seed simulated sensor record
        sensor = Sensor(
            id=f"sns-{loc_id}",
            location_id=loc_id,
            sensor_code=f"SNS-SIM-{loc_id.upper()}",
            installation_status="SIMULATED",
            sensor_type="ultrasonic_depth",
            is_active=True,
            last_heartbeat=now,
            created_at=now
        )
        db.add(sensor)

        # Initial reading
        reading = WaterReading(
            location_id=loc_id,
            sensor_id=sensor.id,
            water_depth_cm=init_depth,
            timestamp=now,
            source="SIMULATED",
            validation_status="VALID",
            validation_note="Baseline initial demonstration measurement"
        )
        db.add(reading)

    db.commit()
    logger.info(f"Seeded {len(geojson.get('features', []))} demonstration locations.")

    # Seed Road Segments from demo graph
    if DEMO_GRAPH_FILE.exists():
        with open(DEMO_GRAPH_FILE, "r", encoding="utf-8") as gf:
            graph_data = json.load(gf)

        for edge in graph_data.get("edges", []):
            associated_loc_id = edge.get("associated_location_id")
            road_status = "OPEN"
            if associated_loc_id == "blr-loc-002":
                road_status = "CONFIRMED_BLOCKED"  # Silk board blocked initially
            elif associated_loc_id in ("blr-loc-001", "blr-loc-005"):
                road_status = "CAUTION"

            segment = RoadSegment(
                id=edge["id"],
                name=edge["name"],
                from_node=edge["from_node"],
                to_node=edge["to_node"],
                distance_km=edge["distance_km"],
                associated_location_id=associated_loc_id,
                status=road_status,
                coordinates_json=json.dumps(edge.get("coordinates", []))
            )
            db.add(segment)

        db.commit()
        logger.info(f"Seeded {len(graph_data.get('edges', []))} road network segments.")
