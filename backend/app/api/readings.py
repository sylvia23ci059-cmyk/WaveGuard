from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.reading import WaterReading
from app.schemas.reading import ReadingCreate, ReadingResponse
from app.services.location_service import process_new_reading

router = APIRouter(tags=["Water Readings"])

@router.get("/readings", response_model=List[ReadingResponse])
def get_readings(
    location_id: Optional[str] = Query(None, description="Filter by location ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(WaterReading)
    if location_id:
        query = query.filter(WaterReading.location_id == location_id)
    readings = query.order_by(WaterReading.timestamp.desc()).limit(limit).all()
    return readings

@router.post("/readings", status_code=status.HTTP_201_CREATED)
def submit_reading(payload: ReadingCreate, db: Session = Depends(get_db)):
    try:
        result = process_new_reading(
            db=db,
            location_id=payload.location_id,
            water_depth_cm=payload.water_depth_cm,
            source=payload.source,
            sensor_id=payload.sensor_id
        )
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
