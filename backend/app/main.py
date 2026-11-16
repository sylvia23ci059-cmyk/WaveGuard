import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_router import api_router
from app.database.session import engine, Base, SessionLocal
from app.database.init_db import seed_initial_data

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("waveguard")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data if needed
    logger.info("Initializing WaveGuard SQLite database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    logger.info("WaveGuard Backend initialized successfully.")
    yield
    # Shutdown
    logger.info("WaveGuard Backend shutting down.")

app = FastAPI(
    title="WAVEGUARD API",
    description="3D Urban Waterlogging Monitoring & Safe Route Guidance System for Bengaluru, Karnataka, India",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "WAVEGUARD",
        "description": "3D Urban Waterlogging Monitoring and Safe Route Guidance System",
        "study_area": "Bengaluru, Karnataka, India",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
