from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WaveGuard Backend API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }
