import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.location import Location
from app.models.reading import WaterReading
from app.models.sensor import Sensor
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse, LocationGeoJSONCollection
from app.services.location_service import refresh_stale_locations

router = APIRouter(tags=["Locations"])

@router.get("/locations", response_model=List[LocationResponse])
def get_locations(
    status: Optional[str] = Query(None, description="Filter by status (NORMAL, CAUTION, BLOCKED, UNKNOWN)"),
    category: Optional[str] = Query(None, description="Filter by category (underpass, subway, etc.)"),
    search: Optional[str] = Query(None, description="Search term for name or road"),
    db: Session = Depends(get_db)
):
    refresh_stale_locations(db)
    query = db.query(Location)

    if status:
        query = query.filter(Location.current_status == status.upper())
    if category:
        query = query.filter(Location.category == category.lower())
    if search:
        s = f"%{search}%"
        query = query.filter((Location.name.ilike(s)) | (Location.road_identifier.ilike(s)) | (Location.description.ilike(s)))

    locations = query.order_by(Location.name.asc()).all()
    
    # Enrich with sensor status
    results = []
    for loc in locations:
        sensor = db.query(Sensor).filter(Sensor.location_id == loc.id).first()
        loc_res = LocationResponse.model_validate(loc)
        loc_res.sensor_installed = sensor is not None and sensor.installation_status != "NOT_INSTALLED"
        loc_res.sensor_status = sensor.installation_status if sensor else "SIMULATED"
        results.append(loc_res)

    return results

@router.get("/locations/geojson")
def get_locations_geojson(db: Session = Depends(get_db)):
    refresh_stale_locations(db)
    locations = db.query(Location).filter(Location.is_active == True).all()

    features = []
    for loc in locations:
        sensor = db.query(Sensor).filter(Sensor.location_id == loc.id).first()
        sensor_status = sensor.installation_status if sensor else "SIMULATED"
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [loc.longitude, loc.latitude]
            },
            "properties": {
                "id": loc.id,
                "name": loc.name,
                "description": loc.description,
                "category": loc.category,
                "road_identifier": loc.road_identifier,
                "caution_threshold_cm": loc.caution_threshold_cm,
                "closure_threshold_cm": loc.closure_threshold_cm,
                "current_status": loc.current_status,
                "current_water_depth_cm": loc.current_water_depth_cm,
                "last_reading_time": loc.last_reading_time.isoformat() if loc.last_reading_time else None,
                "source_info": loc.source_info,
                "verification_status": loc.verification_status,
                "sensor_installation_status": sensor_status
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "metadata": {
            "city": "Bengaluru, Karnataka, India",
            "total_features": len(features)
        },
        "features": features
    }

@router.get("/locations/{id}", response_model=LocationResponse)
def get_location_by_id(id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{id}' not found")
    
    sensor = db.query(Sensor).filter(Sensor.location_id == loc.id).first()
    loc_res = LocationResponse.model_validate(loc)
    loc_res.sensor_installed = sensor is not None and sensor.installation_status != "NOT_INSTALLED"
    loc_res.sensor_status = sensor.installation_status if sensor else "SIMULATED"
    return loc_res

@router.get("/locations/{id}/history")
def get_location_reading_history(id: str, limit: int = 50, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{id}' not found")
    
    readings = db.query(WaterReading).filter(WaterReading.location_id == id).order_by(WaterReading.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "water_depth_cm": r.water_depth_cm,
            "timestamp": r.timestamp.isoformat(),
            "source": r.source,
            "validation_status": r.validation_status
        }
        for r in readings
    ]

@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate, db: Session = Depends(get_db)):
    loc_id = payload.id or f"blr-loc-{uuid.uuid4().hex[:6]}"
    
    # Check duplicate
    existing = db.query(Location).filter(Location.id == loc_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Location with ID '{loc_id}' already exists")

    new_loc = Location(
        id=loc_id,
        name=payload.name,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        category=payload.category,
        road_identifier=payload.road_identifier,
        caution_threshold_cm=payload.caution_threshold_cm,
        closure_threshold_cm=payload.closure_threshold_cm,
        is_active=payload.is_active,
        verification_status=payload.verification_status,
        source_info=payload.source_info,
        current_status="UNKNOWN",
        current_water_depth_cm=0.0
    )
    db.add(new_loc)
    
    # Automatically add a simulated sensor record
    sensor = Sensor(
        id=f"sns-{loc_id}",
        location_id=loc_id,
        sensor_code=f"SNS-SIM-{loc_id.upper()}",
        installation_status="SIMULATED",
        sensor_type="ultrasonic_depth",
        is_active=True
    )
    db.add(sensor)
    
    db.commit()
    db.refresh(new_loc)
    
    loc_res = LocationResponse.model_validate(new_loc)
    loc_res.sensor_installed = True
    loc_res.sensor_status = "SIMULATED"
    return loc_res

@router.put("/locations/{id}", response_model=LocationResponse)
def update_location(id: str, payload: LocationUpdate, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{id}' not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(loc, field, val)

    db.commit()
    db.refresh(loc)
    
    sensor = db.query(Sensor).filter(Sensor.location_id == loc.id).first()
    loc_res = LocationResponse.model_validate(loc)
    loc_res.sensor_installed = sensor is not None and sensor.installation_status != "NOT_INSTALLED"
    loc_res.sensor_status = sensor.installation_status if sensor else "SIMULATED"
    return loc_res

@router.delete("/locations/{id}", status_code=status.HTTP_200_OK)
def delete_location(id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{id}' not found")
    
    db.delete(loc)
    db.commit()
    return {"success": True, "message": f"Location '{id}' deleted successfully"}
