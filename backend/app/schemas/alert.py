from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AlertBase(BaseModel):
    location_id: str
    alert_type: str
    severity: str = "INFO"  # INFO, WARNING, CRITICAL
    description: str

class AlertCreate(AlertBase):
    pass

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: Optional[str] = "Admin Operator"

class AlertResponse(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    location_name: Optional[str] = None
