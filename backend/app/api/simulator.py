from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.simulator.engine import simulator_engine
from app.schemas.simulator import (
    SimulatorStatusResponse, SimulatorStartRequest,
    SimulatorManualReadingRequest, SimulatorScenarioRequest
)
from app.services.location_service import process_new_reading
from app.models.location import Location
from app.models.reading import WaterReading
from app.models.alert import Alert
from app.models.status_history import StatusHistory
from app.models.road_segment import RoadSegment

router = APIRouter(tags=["Simulator"])

@router.get("/simulator/status", response_model=SimulatorStatusResponse)
def get_simulator_status():
    return simulator_engine.get_status()

@router.post("/simulator/start", response_model=SimulatorStatusResponse)
def start_simulator(payload: SimulatorStartRequest = SimulatorStartRequest()):
    simulator_engine.start(interval_seconds=payload.interval_seconds, scenario=payload.scenario)
    return simulator_engine.get_status()

@router.post("/simulator/stop", response_model=SimulatorStatusResponse)
def stop_simulator():
    simulator_engine.stop()
    return simulator_engine.get_status()

@router.post("/simulator/step")
def step_simulator():
    return simulator_engine.step()

@router.post("/simulator/scenario", response_model=SimulatorStatusResponse)
def set_simulator_scenario(payload: SimulatorScenarioRequest):
    valid_scenarios = ["DRY_WEATHER", "LIGHT_SHOWERS", "MONSOON_SURGE", "FLASH_FLOOD", "RECEDING"]
    if payload.scenario_name.upper() not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario '{payload.scenario_name}'. Allowed: {valid_scenarios}")
    simulator_engine.set_scenario(payload.scenario_name.upper())
    return simulator_engine.get_status()

@router.post("/simulator/manual-reading")
def inject_manual_reading(payload: SimulatorManualReadingRequest, db: Session = Depends(get_db)):
    try:
        res = process_new_reading(
            db=db,
            location_id=payload.location_id,
            water_depth_cm=payload.water_depth_cm,
            source=payload.source or "MANUAL"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/simulator/reset")
def reset_demonstration_data(db: Session = Depends(get_db)):
    """
    Resets all simulated readings, alerts, and status history,
    restoring locations to clean initial baseline.
    """
    simulator_engine.stop()

    # Clear readings, alerts, status history
    db.query(Alert).delete()
    db.query(WaterReading).delete()
    db.query(StatusHistory).delete()

    # Reset locations to NORMAL / 0 depth
    locations = db.query(Location).all()
    for loc in locations:
        loc.current_status = "NORMAL"
        loc.current_water_depth_cm = 2.0
        loc.last_reading_time = None

    # Reset road segments to OPEN
    road_segments = db.query(RoadSegment).all()
    for seg in road_segments:
        seg.status = "OPEN"

    db.commit()

    return {
        "success": True,
        "message": "WaveGuard demonstration database reset to baseline normal state.",
        "simulator_status": simulator_engine.get_status()
    }
