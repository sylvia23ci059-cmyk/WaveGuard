from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router
from app.api.locations import router as locations_router
from app.api.readings import router as readings_router
from app.api.alerts import router as alerts_router
from app.api.routes import router as routes_router
from app.api.simulator import router as simulator_router
from app.api.ai import router as ai_router
from app.api.settings import router as settings_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(locations_router)
api_router.include_router(readings_router)
api_router.include_router(alerts_router)
api_router.include_router(routes_router)
api_router.include_router(simulator_router)
api_router.include_router(ai_router)
api_router.include_router(settings_router)
