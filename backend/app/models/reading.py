from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class WaterReading(Base):
    __tablename__ = "water_readings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=False, index=True)
    sensor_id = Column(String(64), ForeignKey("sensors.id"), nullable=True)
    water_depth_cm = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String(32), nullable=False, default="SIMULATED")  # SIMULATED, MANUAL, HARDWARE
    validation_status = Column(String(32), nullable=False, default="VALID")  # VALID, INVALID, SUSPECT
    validation_note = Column(String(255), nullable=True)

    # Relationships
    location = relationship("Location", back_populates="readings")
    sensor = relationship("Sensor", back_populates="readings")
