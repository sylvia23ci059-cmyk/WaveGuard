"""
WaveGuard Database Initialization Script
Initializes the SQLite database and seeds initial Bengaluru demonstration locations.
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database.session import engine, Base, SessionLocal
from app.database.init_db import seed_initial_data

def main():
    print("=" * 60)
    print("WAVEGUARD: Initializing Database Schema & Bengaluru Locations")
    print("=" * 60)

    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        seed_initial_data(db, force_reseed=False)
        print("Initial demonstration dataset verified.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

    print("=" * 60)
    print("Database initialization complete! Database ready for WaveGuard.")
    print("=" * 60)

if __name__ == "__main__":
    main()
