import asyncio
import logging
import random
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.location import Location
from app.services.location_service import process_new_reading

logger = logging.getLogger(__name__)

SCENARIO_DRY_WEATHER = "DRY_WEATHER"
SCENARIO_LIGHT_SHOWERS = "LIGHT_SHOWERS"
SCENARIO_MONSOON_SURGE = "MONSOON_SURGE"
SCENARIO_FLASH_FLOOD = "FLASH_FLOOD"
SCENARIO_RECEDING = "RECEDING"

class SimulationEngine:
    def __init__(self):
        self.is_running: bool = False
        self.interval_seconds: int = 5
        self.active_scenario: str = SCENARIO_MONSOON_SURGE
        self.readings_generated_count: int = 0
        self.last_tick_time: Optional[datetime] = None
        self._task: Optional[asyncio.Task] = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "readings_generated_count": self.readings_generated_count,
            "active_scenario": self.active_scenario,
            "last_tick_time": self.last_tick_time.isoformat() if self.last_tick_time else None,
            "data_source_mode": "SIMULATED_DEMO_PIPELINE"
        }

    def start(self, interval_seconds: int = 5, scenario: str = SCENARIO_MONSOON_SURGE):
        self.interval_seconds = interval_seconds
        self.active_scenario = scenario
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info(f"Simulator started with interval {interval_seconds}s, scenario '{scenario}'")

    def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            self._task = None
        logger.info("Simulator stopped.")

    def set_scenario(self, scenario: str):
        self.active_scenario = scenario
        logger.info(f"Simulator scenario changed to '{scenario}'")

    async def _run_loop(self):
        while self.is_running:
            try:
                self.step()
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulator loop: {e}", exc_info=True)
                await asyncio.sleep(self.interval_seconds)

    def step(self) -> Dict[str, Any]:
        """
        Executes a single simulation tick: calculates realistic target water levels
        for each location based on current scenario, then updates the database.
        """
        db: Session = SessionLocal()
        generated_count = 0
        updated_locations = []

        try:
            locations = db.query(Location).filter(Location.is_active == True).all()
            for loc in locations:
                target_depth = self._calculate_target_depth(loc)
                # Introduce slight sensor fluctuation (+/- 0.8 cm)
                jitter = random.uniform(-0.8, 0.8)
                water_depth = max(0.0, round(target_depth + jitter, 1))

                res = process_new_reading(
                    db=db,
                    location_id=loc.id,
                    water_depth_cm=water_depth,
                    source="SIMULATED"
                )
                generated_count += 1
                updated_locations.append({
                    "id": loc.id,
                    "name": loc.name,
                    "depth_cm": water_depth,
                    "status": res["status"]
                })

            self.readings_generated_count += generated_count
            self.last_tick_time = datetime.utcnow()

            return {
                "success": True,
                "scenario": self.active_scenario,
                "readings_generated": generated_count,
                "updated_locations": updated_locations
            }
        finally:
            db.close()

    def _calculate_target_depth(self, loc: Location) -> float:
        """
        Calculates realistic scenario depths for underpasses based on location category and scenario.
        """
        sc = self.active_scenario

        if sc == SCENARIO_DRY_WEATHER:
            # Completely clear dry conditions
            return random.uniform(0.0, 3.0)

        elif sc == SCENARIO_LIGHT_SHOWERS:
            # Low waterlogging across city
            if "Marathahalli" in loc.name or "Silk Board" in loc.name:
                return loc.caution_threshold_cm * 0.75  # Near caution
            return random.uniform(2.0, 9.0)

        elif sc == SCENARIO_MONSOON_SURGE:
            # Major monsoon rainfall hitting eastern & southern corridors
            if "Marathahalli" in loc.name:
                # Confirmed closure
                return loc.closure_threshold_cm + random.uniform(4.0, 10.0)
            elif "Silk Board" in loc.name:
                # Critical closure
                return loc.closure_threshold_cm + random.uniform(3.0, 8.0)
            elif "Domlur" in loc.name or "Bellandur" in loc.name:
                # Caution level
                return loc.caution_threshold_cm + random.uniform(1.0, 6.0)
            elif "Hebbal" in loc.name or "KR Circle" in loc.name:
                # Normal
                return random.uniform(3.0, 8.0)
            else:
                return random.uniform(2.0, 12.0)

        elif sc == SCENARIO_FLASH_FLOOD:
            # City-wide cloudburst
            if "Underpass" in loc.name or "Subway" in loc.name:
                return loc.closure_threshold_cm + random.uniform(2.0, 15.0)
            return loc.caution_threshold_cm + random.uniform(2.0, 7.0)

        elif sc == SCENARIO_RECEDING:
            # Pumps deployed, water level drops
            current = loc.current_water_depth_cm
            return max(0.0, current - random.uniform(5.0, 12.0))

        return random.uniform(0.0, 5.0)

# Global singleton instance
simulator_engine = SimulationEngine()
