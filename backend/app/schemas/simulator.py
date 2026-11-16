from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SimulatorStatusResponse(BaseModel):
    is_running: bool
    interval_seconds: int
    readings_generated_count: int
    active_scenario: str
    last_tick_time: Optional[str] = None
    data_source_mode: str = "SIMULATED_DEMO_PIPELINE"

class SimulatorStartRequest(BaseModel):
    interval_seconds: Optional[int] = Field(default=5, ge=1, le=60)
    scenario: Optional[str] = Field(default="MONSOON_SURGE")

class SimulatorManualReadingRequest(BaseModel):
    location_id: str
    water_depth_cm: float = Field(..., ge=0.0, le=500.0)
    source: str = "MANUAL"

class SimulatorScenarioRequest(BaseModel):
    scenario_name: str  # DRY_WEATHER, LIGHT_SHOWERS, MONSOON_SURGE, FLASH_FLOOD, RECEDING
