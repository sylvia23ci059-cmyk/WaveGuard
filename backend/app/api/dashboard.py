from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.location import Location
from app.models.alert import Alert
from app.models.reading import WaterReading
from app.simulator.engine import simulator_engine
from app.services.location_service import refresh_stale_locations

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Refresh staleness first
    refresh_stale_locations(db)

    locations = db.query(Location).filter(Location.is_active == True).all()
    total = len(locations)
    normal = sum(1 for loc in locations if loc.current_status == "NORMAL")
    caution = sum(1 for loc in locations if loc.current_status == "CAUTION")
    blocked = sum(1 for loc in locations if loc.current_status == "BLOCKED")
    unknown = sum(1 for loc in locations if loc.current_status == "UNKNOWN")

    # Recent 6 readings
    recent_readings_query = db.query(WaterReading).order_by(WaterReading.timestamp.desc()).limit(6).all()
    loc_names = {loc.id: loc.name for loc in locations}
    recent_readings = [
        {
            "id": r.id,
            "location_id": r.location_id,
            "location_name": loc_names.get(r.location_id, r.location_id),
            "water_depth_cm": r.water_depth_cm,
            "timestamp": r.timestamp.isoformat(),
            "source": r.source,
            "validation_status": r.validation_status
        }
        for r in recent_readings_query
    ]

    # Recent 5 unacknowledged/critical alerts
    alerts_query = db.query(Alert).order_by(Alert.timestamp.desc()).limit(5).all()
    recent_alerts = [
        {
            "id": a.id,
            "location_id": a.location_id,
            "location_name": loc_names.get(a.location_id, a.location_id),
            "alert_type": a.alert_type,
            "severity": a.severity,
            "description": a.description,
            "timestamp": a.timestamp.isoformat(),
            "is_acknowledged": a.is_acknowledged
        }
        for a in alerts_query
    ]

    # Distribution
    distribution = {
        "NORMAL": normal,
        "CAUTION": caution,
        "BLOCKED": blocked,
        "UNKNOWN": unknown
    }

    # Latest system update timestamp
    last_update = max([loc.updated_at for loc in locations if loc.updated_at] or [datetime.utcnow()]).isoformat()

    return {
        "summary": {
            "total_locations": total,
            "normal_locations": normal,
            "caution_locations": caution,
            "blocked_locations": blocked,
            "unknown_locations": unknown
        },
        "distribution": distribution,
        "recent_readings": recent_readings,
        "recent_alerts": recent_alerts,
        "last_system_update": last_update,
        "simulator": simulator_engine.get_status(),
        "data_source_indicator": {
            "mode": "SIMULATED_DEMO_PIPELINE",
            "disclosure": "College Prototype - Simulated Sensor Telemetry (No physical sensors currently deployed)",
            "study_area": "Bengaluru, Karnataka, India"
        }
    }
