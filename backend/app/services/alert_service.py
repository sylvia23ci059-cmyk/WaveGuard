from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.location import Location

ALERT_CAUTION_LEVEL = "CAUTION_LEVEL"
ALERT_THRESHOLD_EXCEEDED = "THRESHOLD_EXCEEDED"
ALERT_CONFIRMED_CLOSURE = "CONFIRMED_CLOSURE"
ALERT_SENSOR_UNAVAILABLE = "SENSOR_UNAVAILABLE"
ALERT_STALE_READING = "STALE_READING"

SEVERITY_INFO = "INFO"
SEVERITY_WARNING = "WARNING"
SEVERITY_CRITICAL = "CRITICAL"

def check_and_create_alert(
    db: Session,
    location_id: str,
    status: str,
    water_depth_cm: float,
    reason: str,
    is_stale: bool = False
) -> Optional[Alert]:
    """
    Evaluates condition and creates an alert if necessary, suppressing duplicate unacknowledged alerts.
    """
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return None

    alert_type = None
    severity = SEVERITY_INFO
    description = ""

    if status == "BLOCKED":
        alert_type = ALERT_CONFIRMED_CLOSURE
        severity = SEVERITY_CRITICAL
        description = f"CRITICAL: Road closure at {location.name}. Water depth reaches {water_depth_cm:.1f} cm exceeding {location.closure_threshold_cm:.1f} cm closure threshold. Passage blocked."
    elif status == "CAUTION":
        alert_type = ALERT_CAUTION_LEVEL
        severity = SEVERITY_WARNING
        description = f"WARNING: Waterlogging caution at {location.name}. Depth measured at {water_depth_cm:.1f} cm (Caution threshold: {location.caution_threshold_cm:.1f} cm)."
    elif is_stale:
        alert_type = ALERT_STALE_READING
        severity = SEVERITY_WARNING
        description = f"TELEMETRY WARNING: Stale readings detected at {location.name}. Telemetry data exceeds maximum freshness window."
    elif status == "UNKNOWN":
        alert_type = ALERT_SENSOR_UNAVAILABLE
        severity = SEVERITY_INFO
        description = f"INFO: Sensor telemetry currently unavailable or status unknown for {location.name}."

    if not alert_type:
        return None

    # Check for recent unacknowledged duplicate alert in the last 30 minutes
    existing = db.query(Alert).filter(
        Alert.location_id == location_id,
        Alert.alert_type == alert_type,
        Alert.is_acknowledged == False
    ).order_by(Alert.timestamp.desc()).first()

    if existing:
        # Don't spam duplicates
        return existing

    # Create new alert
    new_alert = Alert(
        location_id=location_id,
        alert_type=alert_type,
        severity=severity,
        description=description,
        timestamp=datetime.utcnow(),
        is_acknowledged=False
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

def acknowledge_alert(db: Session, alert_id: int, operator_name: str = "Admin Operator") -> Optional[Alert]:
    """
    Marks an alert as acknowledged.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None
    alert.is_acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = operator_name
    db.commit()
    db.refresh(alert)
    return alert
