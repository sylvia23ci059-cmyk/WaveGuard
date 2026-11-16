import os
import json
from pathlib import Path
from typing import Dict, Any

DEMO_GRAPH_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "demo_road_graph" / "bengaluru_corridors.json"

def load_demo_graph() -> Dict[str, Any]:
    """
    Loads the bundled demonstration road graph for Bengaluru corridors.
    """
    if not DEMO_GRAPH_PATH.exists():
        raise FileNotFoundError(f"Demonstration road network graph not found at {DEMO_GRAPH_PATH}")
    
    with open(DEMO_GRAPH_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
