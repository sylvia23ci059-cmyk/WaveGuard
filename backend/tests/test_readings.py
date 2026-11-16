import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_submit_valid_reading():
    # Submit reading for Marathahalli
    payload = {
        "location_id": "blr-loc-001",
        "water_depth_cm": 12.0,
        "source": "SIMULATED"
    }
    response = client.post("/api/readings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "NORMAL"  # 12 cm < 15 cm caution threshold

    # Now submit a caution reading (25 cm)
    payload_caution = {
        "location_id": "blr-loc-001",
        "water_depth_cm": 25.0,
        "source": "SIMULATED"
    }
    res_c = client.post("/api/readings", json=payload_caution)
    assert res_c.status_code == 201
    assert res_c.json()["status"] == "CAUTION"

    # Now submit a blocked reading (40 cm >= 35 cm)
    payload_blocked = {
        "location_id": "blr-loc-001",
        "water_depth_cm": 40.0,
        "source": "SIMULATED"
    }
    res_b = client.post("/api/readings", json=payload_blocked)
    assert res_b.status_code == 201
    assert res_b.json()["status"] == "BLOCKED"

def test_reject_invalid_reading():
    # Negative water reading
    payload_neg = {
        "location_id": "blr-loc-001",
        "water_depth_cm": -15.0,
        "source": "SIMULATED"
    }
    res = client.post("/api/readings", json=payload_neg)
    assert res.status_code == 400
    assert "rejected" in res.json()["detail"].lower()
