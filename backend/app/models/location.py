from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    category = Column(String(64), nullable=False, default="underpass")  # underpass, subway, arterial_lowpoint, intersection
    road_identifier = Column(String(128), nullable=True)
    caution_threshold_cm = Column(Float, nullable=False, default=15.0)
    closure_threshold_cm = Column(Float, nullable=False, default=35.0)
    is_active = Column(Boolean, nullable=False, default=True)
    verification_status = Column(String(64), nullable=False, default="DEMONSTRATION_VERIFIED")
    current_status = Column(String(32), nullable=False, default="UNKNOWN")  # NORMAL, CAUTION, BLOCKED, UNKNOWN
    current_water_depth_cm = Column(Float, nullable=False, default=0.0)
    last_reading_time = Column(DateTime, nullable=True)
    source_info = Column(String(255), nullable=False, default="OpenStreetMap & BBMP Flood Survey")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sensors = relationship("Sensor", back_populates="location", cascade="all, delete-orphan")
    readings = relationship("WaterReading", back_populates="location", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="location", cascade="all, delete-orphan")
    road_segments = relationship("RoadSegment", back_populates="location")
    status_history = relationship("StatusHistory", back_populates="location", cascade="all, delete-orphan")
