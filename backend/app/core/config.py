import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend or root directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "WAVEGUARD - 3D Urban Waterlogging Monitoring & Safe Route Guidance")
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./waveguard.db")
    
    # CORS
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,*").split(",")
        if origin.strip()
    ]
    
    # Data Freshness Window (minutes)
    FRESHNESS_WINDOW_MINUTES: int = int(os.getenv("FRESHNESS_WINDOW_MINUTES", "30"))
    
    # AI Assistant (Groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    # Simulation
    SIMULATOR_INTERVAL_SECONDS: int = int(os.getenv("SIMULATOR_INTERVAL_SECONDS", "5"))

settings = Settings()
