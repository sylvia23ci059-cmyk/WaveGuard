"""
WaveGuard Database Reset Script
Resets demonstration data with a mandatory confirmation prompt to prevent accidental data loss.
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database.session import engine, Base, SessionLocal
from app.models.location import Location
from app.models.reading import WaterReading
from app.models.alert import Alert
from app.models.sensor import Sensor
from app.models.road_segment import RoadSegment
from app.models.status_history import StatusHistory
from app.database.init_db import seed_initial_data

def main():
    print("=" * 60)
    print("WAVEGUARD DEMO DATA RESET UTILITY")
    print("=" * 60)
    print("WARNING: This action will delete all historical readings,")
    print("alerts, status history, and re-seed clean baseline locations.")
    print("=" * 60)

    # In non-interactive mode or automated script
    confirm = os.environ.get("WAVEGUARD_FORCE_RESET", "")
    if confirm != "YES":
        try:
            user_input = input("Are you sure you want to proceed? Type 'YES' to confirm: ").strip()
            if user_input != "YES":
                print("Reset cancelled by user.")
                sys.exit(0)
        except EOFError:
            print("Non-interactive session detected without WAVEGUARD_FORCE_RESET=YES. Aborting.")
            sys.exit(1)

    print("\nResetting database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_initial_data(db, force_reseed=True)
        print("Database successfully restored to clean demonstration baseline!")
    except Exception as e:
        print(f"Error during re-seed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
