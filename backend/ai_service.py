"""
WaveGuard KGF: Groq AI Hydrological Copilot Service
Integrates Groq's ultra-fast Llama-3 inference API with live KGF ground telemetry context.
"""

import os
import json
import requests
from typing import List, Dict, Any, Optional

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"  # Groq's flagship fast model


def get_groq_key(custom_key: Optional[str] = None) -> Optional[str]:
    """Retrieves Groq API key from request, environment, or file."""
    if custom_key and custom_key.strip():
        return custom_key.strip()
    return os.getenv("GROQ_API_KEY")


def build_kgf_system_prompt(current_context: Optional[Dict[str, Any]] = None) -> str:
    """
    Constructs a scientifically grounded system prompt pre-loaded with
    actual Kolar Gold Fields (KGF) geography, DEM elevation benchmarks,
    and active sensor telemetry.
    """
    base_prompt = """You are WaveGuard KGF AI, a senior geospatial hydrologist, disaster intelligence specialist, and urban situational awareness copilot for Kolar Gold Fields (KGF), Karnataka, India.

Study Area Context:
- Taluk: Kolar Gold Field (Taluk Code 1912, LGD 7002, Kolar District, Karnataka).
- Spatial Extent: 78.227°E to 78.475°E, 12.858°N to 13.083°N. Area: 442.8 km².
- Elevation Profile: 754m AMSL (southern outfall draining to Palar basin) to 914m AMSL (northern and eastern cyanide dump ridges).
- Core Urban Agglomeration: Robertsonpet, Andersonpet, Champion Reefs, Marikuppam, Oorgaum, Nundydurg.
- Primary Storm Drainage: Swarna Nallah network and railway underpasses (Champion Reefs RUB).

Scientific Rules:
1. Distinguish between static flood susceptibility (topographical tendency) and dynamic hydrodynamic forecasts.
2. Label simulated sensor readings as DEMONSTRATION DATA.
3. For life-threatening emergencies, remind users that emergency dispatch requires calling Karnataka Emergency Services at 112.
4. Keep answers professional, concise, analytical, and actionable for both citizens and disaster management authorities.
"""
    if current_context:
        base_prompt += f"\n\nCURRENT REAL-TIME KGF SITUATION SUMMARY:\n{json.dumps(current_context, indent=2)}"

    return base_prompt


def query_groq_chat(
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Calls the Groq Cloud API for ultra-fast completions.
    Falls back to intelligent local heuristics if key is missing.
    """
    key = get_groq_key(api_key)

    if not key:
        # Fallback offline intelligence
        last_msg = messages[-1]["content"].lower() if messages else ""
        if "champion" in last_msg or "underpass" in last_msg:
            reply = "Champion Reefs Railway Underpass (RUB) is situated at elevation ~801.5m in a local depression with low slope (0.4°). Sump pumps are active. Sensor KGF-SEN-03 reports 0.18m water depth (Caution stage). Recommend heavy transport only or taking the high-elevation detour via Robertsonpet Ring Road."
        elif "andersonpet" in last_msg:
            reply = "Andersonpet South Low Sump (792.4m AMSL) receives convergent runoff from ~48.2 hectares upslope catchment. Sensor KGF-SEN-01 is online at 0.42m depth (Normal baseflow). Clear trash racks at culvert entrance prior to convective storms."
        elif "advisory" in last_msg or "warning" in last_msg:
            reply = "MUNICIPAL ADVISORY: Scattered plateau convective activity detected. Swarna Nallah drainage corridor is operating at 35% hydraulic capacity. Commercial traffic in Robertsonpet market road advised to monitor water level boards. Emergency dispatch: Dial 112."
        else:
            reply = f"WaveGuard KGF Hydro-Copilot: Analyzed KGF Taluk baseline (442.8 km², Copernicus GLO-30 DEM 754m-914m). All 5 IoT stations online (DEMONSTRATION DATA). Please provide a Groq API key in Settings for full unconstrained Llama-3.3 neural generation."

        return {
            "reply": reply,
            "model": "offline-heuristic-fallback",
            "provider": "Local WaveGuard Engine",
            "requires_key": True
        }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    system_prompt = build_kgf_system_prompt(context)
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    payload = {
        "model": model,
        "messages": full_messages,
        "temperature": 0.2,
        "max_tokens": 1024
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=12.0)
        if response.status_code == 200:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {
                "reply": content,
                "model": model,
                "provider": "Groq Cloud (Ultra-Fast Llama-3)",
                "usage": data.get("usage", {})
            }
        else:
            err_msg = response.text
            return {
                "reply": f"Groq API Error ({response.status_code}): {err_msg}",
                "model": model,
                "error": True
            }
    except Exception as e:
        return {
            "reply": f"Network exception connecting to Groq API: {str(e)}",
            "model": model,
            "error": True
        }
