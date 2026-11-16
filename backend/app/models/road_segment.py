from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    from_node = Column(String(64), nullable=False, index=True)
    to_node = Column(String(64), nullable=False, index=True)
    distance_km = Column(Float, nullable=False)
    associated_location_id = Column(String(64), ForeignKey("locations.id"), nullable=True, index=True)
    status = Column(String(32), nullable=False, default="OPEN")  # OPEN, CAUTION, CONFIRMED_BLOCKED
    coordinates_json = Column(Text, nullable=True)  # JSON encoded list of [lng, lat] points

    # Relationship
    location = relationship("Location", back_populates="road_segments")
