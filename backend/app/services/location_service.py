from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.location import Location
from app.models.reading import WaterReading
from app.models.status_history import StatusHistory
from app.models.road_segment import RoadSegment
from app.models.sensor import Sensor
from app.services.classification import classify_waterlogging, validate_reading, is_reading_stale
from app.services.alert_service import check_and_create_alert

def process_new_reading(
    db: Session,
    location_id: str,
    water_depth_cm: float,
    source: str = "SIMULATED",
    sensor_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ingests a new water reading, validates it, classifies status, updates location and road segments,
    and creates alerts if appropriate.
    """
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise ValueError(f"Location '{location_id}' not found")

    # 1. Validate
    is_valid, note = validate_reading(water_depth_cm)
    val_status = "VALID" if is_valid else "INVALID"

    # 2. Record reading in database
    now = datetime.utcnow()
    reading = WaterReading(
        location_id=location_id,
        sensor_id=sensor_id,
        water_depth_cm=water_depth_cm,
        timestamp=now,
        source=source,
        validation_status=val_status,
        validation_note=note
    )
    db.add(reading)

    if not is_valid:
        db.commit()
        return {
            "success": False,
            "message": f"Reading rejected: {note}",
            "reading_id": reading.id,
            "validation_status": val_status
        }

    # 3. Classify status
    status, reason, is_stale = classify_waterlogging(
        water_depth_cm=water_depth_cm,
        caution_threshold_cm=location.caution_threshold_cm,
        closure_threshold_cm=location.closure_threshold_cm,
        reading_time=now
    )

    old_status = location.current_status
    location.current_status = status
    location.current_water_depth_cm = water_depth_cm
    location.last_reading_time = now
    location.updated_at = now

    # 4. Record status change in history if changed
    if old_status != status:
        history = StatusHistory(
            location_id=location_id,
            status=status,
            water_depth_cm=water_depth_cm,
            timestamp=now,
            reason=reason
        )
        db.add(history)

    # 5. Update associated road segment status
    road_status = "OPEN"
    if status == "BLOCKED":
        road_status = "CONFIRMED_BLOCKED"
    elif status == "CAUTION":
        road_status = "CAUTION"

    segments = db.query(RoadSegment).filter(RoadSegment.associated_location_id == location_id).all()
    for seg in segments:
        seg.status = road_status

    db.commit()
    db.refresh(location)

    # 6. Check and create alert
    alert = check_and_create_alert(
        db=db,
        location_id=location_id,
        status=status,
        water_depth_cm=water_depth_cm,
        reason=reason,
        is_stale=is_stale
    )

    return {
        "success": True,
        "reading_id": reading.id,
        "location_id": location_id,
        "location_name": location.name,
        "water_depth_cm": water_depth_cm,
        "status": status,
        "previous_status": old_status,
        "reason": reason,
        "alert_created": alert is not None and not alert.is_acknowledged
    }

def refresh_stale_locations(db: Session) -> int:
    """
    Checks all active locations and marks locations with outdated readings as UNKNOWN.
    """
    locations = db.query(Location).filter(Location.is_active == True).all()
    stale_count = 0
    now = datetime.utcnow()

    for loc in locations:
        if loc.last_reading_time and is_reading_stale(loc.last_reading_time):
            if loc.current_status != "UNKNOWN":
                loc.current_status = "UNKNOWN"
                stale_count += 1
                history = StatusHistory(
                    location_id=loc.id,
                    status="UNKNOWN",
                    water_depth_cm=loc.current_water_depth_cm,
                    timestamp=now,
                    reason="Marked UNKNOWN due to stale telemetry data exceeding freshness threshold"
                )
                db.add(history)
                # Reset road segments to UNKNOWN / CAUTION awareness
                segments = db.query(RoadSegment).filter(RoadSegment.associated_location_id == loc.id).all()
                for seg in segments:
                    seg.status = "OPEN"  # Cannot confirm blocked, but status flagged
                
                check_and_create_alert(
                    db=db,
                    location_id=loc.id,
                    status="UNKNOWN",
                    water_depth_cm=loc.current_water_depth_cm,
                    reason="Stale data",
                    is_stale=True
                )
        elif not loc.last_reading_time:
            if loc.current_status != "UNKNOWN":
                loc.current_status = "UNKNOWN"
                stale_count += 1

    if stale_count > 0:
        db.commit()
    return stale_count
