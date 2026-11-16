import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_alerts_lifecycle():
    # 1. Trigger an alert by sending high water reading
    client.post("/api/readings", json={
        "location_id": "blr-loc-003",  # Hebbal
        "water_depth_cm": 52.0,        # Exceeds 45 cm closure
        "source": "SIMULATED"
    })

    # 2. Get alerts
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0

    # Find the unacknowledged Hebbal alert
    hebbal_alert = next((a for a in alerts if a["location_id"] == "blr-loc-003" and not a["is_acknowledged"]), None)
    assert hebbal_alert is not None
    assert hebbal_alert["severity"] == "CRITICAL"

    # 3. Acknowledge alert
    ack_res = client.post(f"/api/alerts/{hebbal_alert['id']}/acknowledge", json={"acknowledged_by": "Test Suite"})
    assert ack_res.status_code == 200
    assert ack_res.json()["is_acknowledged"] is True
    assert ack_res.json()["acknowledged_by"] == "Test Suite"
