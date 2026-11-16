from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class LocationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    category: str = Field(default="underpass")
    road_identifier: Optional[str] = None
    caution_threshold_cm: float = Field(default=15.0, ge=1.0)
    closure_threshold_cm: float = Field(default=35.0, ge=2.0)
    is_active: bool = True
    verification_status: str = Field(default="DEMONSTRATION_VERIFIED")
    source_info: str = Field(default="OpenStreetMap & BBMP Flood Survey")

class LocationCreate(LocationBase):
    id: Optional[str] = None

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    road_identifier: Optional[str] = None
    caution_threshold_cm: Optional[float] = None
    closure_threshold_cm: Optional[float] = None
    is_active: Optional[bool] = None
    verification_status: Optional[str] = None
    source_info: Optional[str] = None

class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    current_status: str
    current_water_depth_cm: float
    last_reading_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    sensor_installed: bool = False
    sensor_status: str = "SIMULATED"

class LocationGeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class LocationGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[LocationGeoJSONFeature]
