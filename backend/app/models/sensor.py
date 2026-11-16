from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String(64), primary_key=True, index=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=False, index=True)
    sensor_code = Column(String(64), unique=True, nullable=False)
    installation_status = Column(String(32), nullable=False, default="SIMULATED")  # SIMULATED, HARDWARE, NOT_INSTALLED
    sensor_type = Column(String(64), nullable=False, default="ultrasonic_depth")
    is_active = Column(Boolean, nullable=False, default=True)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    location = relationship("Location", back_populates="sensors")
    readings = relationship("WaterReading", back_populates="sensor")
