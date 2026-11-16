from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=False, index=True)
    alert_type = Column(String(64), nullable=False)  # CAUTION_LEVEL, THRESHOLD_EXCEEDED, CONFIRMED_CLOSURE, SENSOR_UNAVAILABLE, STALE_READING
    severity = Column(String(32), nullable=False, default="INFO")  # INFO, WARNING, CRITICAL
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_acknowledged = Column(Boolean, nullable=False, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(64), nullable=True)

    # Relationship
    location = relationship("Location", back_populates="alerts")
