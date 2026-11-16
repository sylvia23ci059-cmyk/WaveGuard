import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_simulator_controls():
    # 1. Get status
    res = client.get("/api/simulator/status")
    assert res.status_code == 200
    status = res.json()
    assert "is_running" in status
    assert status["data_source_mode"] == "SIMULATED_DEMO_PIPELINE"

    # 2. Step simulator
    step_res = client.post("/api/simulator/step")
    assert step_res.status_code == 200
    step_data = step_res.json()
    assert step_data["success"] is True
    assert step_data["readings_generated"] >= 12

    # 3. Change scenario to DRY_WEATHER
    scen_res = client.post("/api/simulator/scenario", json={"scenario_name": "DRY_WEATHER"})
    assert scen_res.status_code == 200
    assert scen_res.json()["active_scenario"] == "DRY_WEATHER"

    # Step in dry weather scenario
    step_dry = client.post("/api/simulator/step")
    assert step_dry.status_code == 200

    # 4. Manual reading injection
    manual_res = client.post("/api/simulator/manual-reading", json={
        "location_id": "blr-loc-001",
        "water_depth_cm": 14.0,
        "source": "MANUAL"
    })
    assert manual_res.status_code == 200
    assert manual_res.json()["water_depth_cm"] == 14.0
