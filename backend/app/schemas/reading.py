from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ReadingBase(BaseModel):
    location_id: str
    water_depth_cm: float = Field(..., ge=-50.0, le=1000.0)
    source: str = Field(default="SIMULATED")  # SIMULATED, MANUAL, HARDWARE
    sensor_id: Optional[str] = None
    validation_status: Optional[str] = "VALID"
    validation_note: Optional[str] = None

class ReadingCreate(ReadingBase):
    pass

class ReadingResponse(ReadingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
