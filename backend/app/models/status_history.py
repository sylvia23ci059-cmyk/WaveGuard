from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    location_id = Column(String(64), ForeignKey("locations.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False)  # NORMAL, CAUTION, BLOCKED, UNKNOWN
    water_depth_cm = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    reason = Column(String(255), nullable=True)

    # Relationship
    location = relationship("Location", back_populates="status_history")
