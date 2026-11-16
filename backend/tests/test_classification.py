from datetime import datetime, timedelta
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.services.classification import (
    classify_waterlogging, validate_reading, is_reading_stale,
    STATUS_NORMAL, STATUS_CAUTION, STATUS_BLOCKED, STATUS_UNKNOWN
)

def test_validate_reading():
    # Valid readings
    assert validate_reading(0.0)[0] is True
    assert validate_reading(15.5)[0] is True
    assert validate_reading(45.0)[0] is True
    
    # Invalid readings
    assert validate_reading(-5.0)[0] is False
    assert validate_reading(600.0)[0] is False
    assert validate_reading(None)[0] is False

def test_staleness_detection():
    now = datetime.utcnow()
    assert is_reading_stale(now, freshness_minutes=30) is False
    
    # 40 minutes old should be stale
    old_time = now - timedelta(minutes=40)
    assert is_reading_stale(old_time, freshness_minutes=30) is True
    
    # None time is stale
    assert is_reading_stale(None) is True

def test_classification_logic():
    now = datetime.utcnow()
    caution_th = 15.0
    closure_th = 35.0

    # Normal condition (5 cm < 15 cm)
    status, reason, is_stale = classify_waterlogging(5.0, caution_th, closure_th, reading_time=now)
    assert status == STATUS_NORMAL
    assert not is_stale

    # Caution condition (20 cm >= 15 cm and < 35 cm)
    status, reason, is_stale = classify_waterlogging(20.0, caution_th, closure_th, reading_time=now)
    assert status == STATUS_CAUTION
    assert not is_stale

    # Blocked condition (40 cm >= 35 cm)
    status, reason, is_stale = classify_waterlogging(40.0, caution_th, closure_th, reading_time=now)
    assert status == STATUS_BLOCKED
    assert not is_stale

    # Stale condition
    stale_time = now - timedelta(minutes=45)
    status, reason, is_stale = classify_waterlogging(20.0, caution_th, closure_th, reading_time=stale_time, freshness_minutes=30)
    assert status == STATUS_UNKNOWN
    assert is_stale is True

    # Invalid negative reading condition
    status, reason, is_stale = classify_waterlogging(-10.0, caution_th, closure_th, reading_time=now)
    assert status == STATUS_UNKNOWN
