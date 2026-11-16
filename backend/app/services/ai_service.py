import os
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.location import Location
from app.models.alert import Alert
from app.models.reading import WaterReading

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are WaveGuard Copilot, an urban hydrology and flood intelligence AI assistant for Bengaluru, Karnataka, India.
Your mission is to help civil engineers, city administrators (BBMP/KSNDMC), and commuters understand real-time waterlogging telemetry, road statuses, and safe rerouting.

CRITICAL DATA-GROUNDING RULES:
1. Use ONLY the verified database telemetry provided below in CURRENT SYSTEM CONTEXT.
2. NEVER fabricate water depths, sensor readings, coordinates, road closures, or safety guarantees.
3. If a location is not in the system, explicitly state that it is not in the WaveGuard monitored inventory.
4. Clearly explain that the system currently uses SIMULATED demonstration telemetry since physical IoT sensors are scheduled for future field deployment.
5. Emphasize that caution areas have restricted vehicle clearance, while BLOCKED areas must be completely avoided.

CURRENT SYSTEM CONTEXT (From Live WaveGuard SQLite Database):
{context_json}
"""

def get_grounding_context(db: Session) -> Dict[str, Any]:
    """
    Extracts current database status to ground the AI model with real data.
    """
    locations = db.query(Location).filter(Location.is_active == True).all()
    
    total = len(locations)
    normal = [loc for loc in locations if loc.current_status == "NORMAL"]
    caution = [loc for loc in locations if loc.current_status == "CAUTION"]
    blocked = [loc for loc in locations if loc.current_status == "BLOCKED"]
    unknown = [loc for loc in locations if loc.current_status == "UNKNOWN"]
    
    recent_alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(5).all()
    
    return {
        "city": "Bengaluru, Karnataka, India",
        "timestamp_utc": str(locations[0].updated_at) if locations else "N/A",
        "summary": {
            "total_monitored_locations": total,
            "normal_count": len(normal),
            "caution_count": len(caution),
            "blocked_count": len(blocked),
            "unknown_count": len(unknown)
        },
        "blocked_locations": [
            {
                "id": loc.id,
                "name": loc.name,
                "water_depth_cm": loc.current_water_depth_cm,
                "closure_threshold_cm": loc.closure_threshold_cm,
                "road": loc.road_identifier
            }
            for loc in blocked
        ],
        "caution_locations": [
            {
                "id": loc.id,
                "name": loc.name,
                "water_depth_cm": loc.current_water_depth_cm,
                "caution_threshold_cm": loc.caution_threshold_cm,
                "road": loc.road_identifier
            }
            for loc in caution
        ],
        "normal_locations": [
            {"id": loc.id, "name": loc.name, "water_depth_cm": loc.current_water_depth_cm}
            for loc in normal
        ],
        "recent_alerts": [
            {"type": a.alert_type, "severity": a.severity, "desc": a.description, "time": str(a.timestamp)}
            for a in recent_alerts
        ],
        "hardware_disclosure": "SIMULATED TELEMETRY (College Prototype - No Physical Sensors Installed)"
    }

def rule_based_fallback(query: str, context: Dict[str, Any]) -> str:
    """
    Intelligent rule-based fallback response engine using real database status when Groq is unavailable.
    """
    q = query.lower()
    summary = context["summary"]
    blocked = context["blocked_locations"]
    caution = context["caution_locations"]
    
    if "blocked" in q or "closed" in q or "closure" in q:
        if not blocked:
            return f"Currently, there are **0 confirmed blocked locations** in Bengaluru out of {summary['total_monitored_locations']} monitored sites. All monitored arterial underpasses are open for transit."
        blocked_list = "\n".join([f"- **{loc['name']}** ({loc['road']}): Water depth is **{loc['water_depth_cm']} cm** (exceeds {loc['closure_threshold_cm']} cm closure limit)." for loc in blocked])
        return f"### Confirmed Blocked Locations ({len(blocked)})\n\nThe following underpass locations are impassable due to severe waterlogging:\n\n{blocked_list}\n\n*Safe rerouting recommendation: WaveGuard Route Guidance has automatically recalculated transit corridors to detour around these segments.*"

    elif "caution" in q or "warning" in q:
        if not caution:
            return f"Currently, there are **0 locations under caution**. Water levels across all monitored underpasses are below their respective caution thresholds."
        caution_list = "\n".join([f"- **{loc['name']}** ({loc['road']}): Water depth is **{loc['water_depth_cm']} cm** (caution threshold is {loc['caution_threshold_cm']} cm)." for loc in caution])
        return f"### Locations Under Caution ({len(caution)})\n\nThe following locations have moderate waterlogging:\n\n{caution_list}\n\n*Commuters driving two-wheelers and sedans are advised to exercise caution or use alternative elevated routes.*"

    elif "summary" in q or "status" in q or "overview" in q:
        return (
            f"### WaveGuard Bengaluru Telemetry Summary\n\n"
            f"- **Total Monitored Sites:** {summary['total_monitored_locations']}\n"
            f"- **Normal (Green):** {summary['normal_count']}\n"
            f"- **Caution (Amber):** {summary['caution_count']}\n"
            f"- **Confirmed Blocked (Red):** {summary['blocked_count']}\n"
            f"- **Unknown / Stale (Grey):** {summary['unknown_count']}\n\n"
            f"*Data Source Note: Telemetry is generated via the WaveGuard simulated data pipeline for prototype validation.*"
        )

    elif "architecture" in q or "system" in q or "how it works" in q:
        return (
            "### WaveGuard System Architecture\n\n"
            "WaveGuard is a modular full-stack smart city platform:\n\n"
            "1. **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + MapLibre GL JS providing 3D vector tile rendering with pitch and tilt.\n"
            "2. **Backend:** Python FastAPI providing RESTful APIs for location management, water telemetry ingestion, threshold validation, and routing.\n"
            "3. **Database:** Persistent SQLite database via SQLAlchemy ORM with normalized tables (`locations`, `sensors`, `water_readings`, `road_segments`, `alerts`, `status_history`).\n"
            "4. **Classification Engine:** Evaluates depth readings against location-specific caution and closure thresholds with staleness detection.\n"
            "5. **Routing Engine:** NetworkX graph model with Dijkstra shortest path algorithm that actively avoids CONFIRMED_BLOCKED road segments.\n"
            "6. **IoT Simulator:** Simulates real-time telemetry pulses across monsoon surge and dry weather scenarios."
        )

    elif "routing" in q or "dijkstra" in q or "route" in q:
        return (
            "### WaveGuard Route Guidance Engine\n\n"
            "WaveGuard implements a deterministic Dijkstra shortest path calculation on a topological graph of Bengaluru's major transport corridors:\n\n"
            "- **Normal Transit:** Routes are optimized for minimum distance.\n"
            "- **Inundation Detour:** When an underpass is marked **BLOCKED**, its corresponding road edge weight is set to infinity (or excluded), forcing the algorithm to find a safe detour.\n"
            "- **Safety First:** The system highlights both the safe alternative route and the avoided hazardous segment."
        )

    else:
        return (
            f"WaveGuard is currently monitoring **{summary['total_monitored_locations']} vulnerable locations** in Bengaluru.\n\n"
            f"- **Normal:** {summary['normal_count']}\n"
            f"- **Caution:** {summary['caution_count']}\n"
            f"- **Blocked:** {summary['blocked_count']}\n\n"
            f"You can ask me about:\n"
            f"- 'Which locations are currently blocked?'\n"
            f"- 'Show me caution areas.'\n"
            f"- 'How does the route guidance engine work?'\n"
            f"- 'Explain the system architecture.'"
        )

async def generate_ai_response(
    db: Session,
    user_query: str,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Generates an AI response grounded in real database status.
    Uses Groq API if available, otherwise falls back gracefully to the rule-based engine.
    """
    context = get_grounding_context(db)
    context_str = json.dumps(context, indent=2)

    api_key = settings.GROQ_API_KEY.strip()
    if not api_key:
        logger.info("No Groq API key configured; using grounded rule-based engine.")
        response_text = rule_based_fallback(user_query, context)
        return {
            "response": response_text,
            "provider": "rule_based_fallback",
            "model": "local_grounded_engine",
            "grounding_data": context["summary"]
        }

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT_TEMPLATE.format(context_json=context_str)}
        ]
        
        # Add past 4 conversational history turns for context
        if conversation_history:
            for turn in conversation_history[-4:]:
                messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
                
        messages.append({"role": "user", "content": user_query})

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=800
        )
        
        answer = completion.choices[0].message.content
        return {
            "response": answer,
            "provider": "groq",
            "model": settings.GROQ_MODEL,
            "grounding_data": context["summary"]
        }

    except Exception as e:
        logger.warning(f"Groq API call failed ({str(e)}). Falling back to rule-based engine.")
        fallback_text = rule_based_fallback(user_query, context)
        return {
            "response": fallback_text,
            "provider": "rule_based_fallback",
            "model": "local_grounded_engine",
            "error_note": f"Groq fallback engaged ({str(e)})",
            "grounding_data": context["summary"]
        }
