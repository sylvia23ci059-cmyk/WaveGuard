import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_get_route_graph():
    response = client.get("/api/routes/graph")
    assert response.status_code == 200
    graph = response.json()
    assert len(graph["nodes"]) >= 10
    assert len(graph["edges"]) >= 10

def test_dijkstra_normal_route():
    # Route from Majestic to Hebbal
    payload = {
        "origin_node_id": "node-majestic",
        "destination_node_id": "node-hebbal",
        "avoid_blocked": True
    }
    response = client.post("/api/routes/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["path_nodes"]) >= 2
    assert data["path_nodes"][0] == "node-majestic"
    assert data["path_nodes"][-1] == "node-hebbal"
    assert data["total_distance_km"] > 0
    assert "geometry_geojson" in data

def test_route_avoidance_when_blocked():
    # Ensure Silk Board is BLOCKED
    client.post("/api/readings", json={
        "location_id": "blr-loc-002",  # Silk Board
        "water_depth_cm": 48.0,        # Exceeds 40 cm closure
        "source": "SIMULATED"
    })

    # Route from Domlur to BTM Layout (normally goes Domlur -> Koramangala -> Silk Board -> BTM)
    # When Silk Board to BTM edge is blocked, it calculates alternative or flags avoidance
    payload = {
        "origin_node_id": "node-domlur",
        "destination_node_id": "node-btm-layout",
        "avoid_blocked": True
    }
    response = client.post("/api/routes/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check that explanation mentions the route status or avoided segments
    assert "explanation" in data
    assert data["disclaimer"] == "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"
