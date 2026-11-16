import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_get_locations_list():
    response = client.get("/api/locations")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) >= 12
    # Verify Marathahalli exists
    names = [loc["name"] for loc in locations]
    assert any("Marathahalli" in n for n in names)

def test_get_locations_geojson():
    response = client.get("/api/locations/geojson")
    assert response.status_code == 200
    geojson = response.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) >= 12
    feat = geojson["features"][0]
    assert feat["type"] == "Feature"
    assert "coordinates" in feat["geometry"]
    assert "caution_threshold_cm" in feat["properties"]

def test_location_crud_cycle():
    # 1. Create a test location
    new_loc_payload = {
        "id": "blr-test-crud-01",
        "name": "Test Richmond Circle Underpass",
        "description": "Demonstration test underpass",
        "latitude": 12.9665,
        "longitude": 77.5992,
        "category": "underpass",
        "road_identifier": "CBD-RC-UP99",
        "caution_threshold_cm": 15.0,
        "closure_threshold_cm": 35.0,
        "is_active": True,
        "verification_status": "DEMONSTRATION_VERIFIED",
        "source_info": "Test Suite Validation"
    }
    create_res = client.post("/api/locations", json=new_loc_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["id"] == "blr-test-crud-01"

    # 2. Read
    get_res = client.get("/api/locations/blr-test-crud-01")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Richmond Circle Underpass"

    # 3. Update
    update_res = client.put("/api/locations/blr-test-crud-01", json={"caution_threshold_cm": 18.0})
    assert update_res.status_code == 200
    assert update_res.json()["caution_threshold_cm"] == 18.0

    # 4. Delete
    del_res = client.delete("/api/locations/blr-test-crud-01")
    assert del_res.status_code == 200

    # Verify not found
    get_after_del = client.get("/api/locations/blr-test-crud-01")
    assert get_after_del.status_code == 404
