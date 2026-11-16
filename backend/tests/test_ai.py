import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_ai_chat_fallback():
    # Chat query asking about status or blocked locations
    payload = {
        "query": "Which locations in Bengaluru are currently blocked?",
        "conversation_history": []
    }
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 10
    assert "grounding_data" in data
    # Provider should be either groq or rule_based_fallback
    assert data["provider"] in ("groq", "rule_based_fallback")
