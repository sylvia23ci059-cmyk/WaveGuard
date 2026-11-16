from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.core.config import settings
from app.simulator.engine import simulator_engine

router = APIRouter(tags=["Settings"])

class SettingsUpdate(BaseModel):
    freshness_window_minutes: Optional[int] = Field(None, ge=1, le=1440)
    simulator_interval_seconds: Optional[int] = Field(None, ge=1, le=120)
    groq_model: Optional[str] = None

@router.get("/settings")
def get_settings():
    has_groq = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5)
    masked_key = ""
    if has_groq:
        masked_key = f"{settings.GROQ_API_KEY[:6]}...{settings.GROQ_API_KEY[-4:]}"

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database_url": settings.DATABASE_URL,
        "freshness_window_minutes": settings.FRESHNESS_WINDOW_MINUTES,
        "simulator_interval_seconds": simulator_engine.interval_seconds,
        "groq_configured": has_groq,
        "groq_key_preview": masked_key,
        "groq_model": settings.GROQ_MODEL,
        "data_source_mode": "SIMULATED_DEMO_PIPELINE",
        "study_area": "Bengaluru, Karnataka, India"
    }

@router.put("/settings")
def update_settings(payload: SettingsUpdate):
    if payload.freshness_window_minutes is not None:
        settings.FRESHNESS_WINDOW_MINUTES = payload.freshness_window_minutes
    if payload.simulator_interval_seconds is not None:
        simulator_engine.interval_seconds = payload.simulator_interval_seconds
    if payload.groq_model is not None:
        settings.GROQ_MODEL = payload.groq_model

    return get_settings()
