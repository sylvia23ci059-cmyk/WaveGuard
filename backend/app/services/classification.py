from datetime import datetime, timedelta
from typing import Tuple, Optional
from app.core.config import settings

STATUS_NORMAL = "NORMAL"
STATUS_CAUTION = "CAUTION"
STATUS_BLOCKED = "BLOCKED"
STATUS_UNKNOWN = "UNKNOWN"

def validate_reading(water_depth_cm: float) -> Tuple[bool, str]:
    """
    Validates a raw water depth reading.
    Returns (is_valid, validation_note).
    Rejects negative values or physical impossibilities (> 500 cm for underpasses).
    """
    if water_depth_cm is None:
        return False, "Null reading value"
    if water_depth_cm < 0.0:
        return False, f"Negative water depth ({water_depth_cm} cm) is physically impossible"
    if water_depth_cm > 500.0:
        return False, f"Reading ({water_depth_cm} cm) exceeds maximum plausible underpass depth threshold (500 cm)"
    return True, "Valid physical measurement"

def is_reading_stale(reading_time: Optional[datetime], freshness_minutes: Optional[int] = None) -> bool:
    """
    Checks if a reading is older than the configured freshness window.
    """
    if not reading_time:
        return True
    window = freshness_minutes if freshness_minutes is not None else settings.FRESHNESS_WINDOW_MINUTES
    cutoff = datetime.utcnow() - timedelta(minutes=window)
    return reading_time < cutoff

def classify_waterlogging(
    water_depth_cm: Optional[float],
    caution_threshold_cm: float,
    closure_threshold_cm: float,
    reading_time: Optional[datetime] = None,
    freshness_minutes: Optional[int] = None
) -> Tuple[str, str, bool]:
    """
    Classifies waterlogging status for a location based on location-specific thresholds.
    
    Returns:
        (status, reason, is_stale)
        status: NORMAL, CAUTION, BLOCKED, or UNKNOWN
    """
    # 1. Missing reading check
    if water_depth_cm is None or reading_time is None:
        return STATUS_UNKNOWN, "No telemetry reading available for location", False

    # 2. Reading validation check
    is_valid, note = validate_reading(water_depth_cm)
    if not is_valid:
        return STATUS_UNKNOWN, f"Reading rejected: {note}", False

    # 3. Freshness / staleness check
    if is_reading_stale(reading_time, freshness_minutes):
        window = freshness_minutes if freshness_minutes is not None else settings.FRESHNESS_WINDOW_MINUTES
        return STATUS_UNKNOWN, f"Telemetry reading is stale (older than {window} minutes)", True

    # 4. Location-specific threshold evaluation
    if water_depth_cm >= closure_threshold_cm:
        return STATUS_BLOCKED, f"Critical inundation ({water_depth_cm:.1f} cm >= {closure_threshold_cm:.1f} cm closure threshold). Road segment impassable.", False
    elif water_depth_cm >= caution_threshold_cm:
        return STATUS_CAUTION, f"Water depth ({water_depth_cm:.1f} cm >= {caution_threshold_cm:.1f} cm caution threshold). Reduced vehicle clearance. Drive with caution.", False
    else:
        return STATUS_NORMAL, f"Water depth ({water_depth_cm:.1f} cm < {caution_threshold_cm:.1f} cm caution threshold). Normal underpass drainage clearance.", False
