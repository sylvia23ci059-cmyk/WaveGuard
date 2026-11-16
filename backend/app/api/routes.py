from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.route import RouteRequest, RouteResponse, GraphInfoResponse
from app.routing.router import route_engine
from app.services.location_service import refresh_stale_locations

router = APIRouter(tags=["Route Guidance"])

@router.get("/routes/graph", response_model=GraphInfoResponse)
def get_route_graph(db: Session = Depends(get_db)):
    refresh_stale_locations(db)
    return route_engine.get_graph_info(db=db)

@router.post("/routes/calculate", response_model=RouteResponse)
def calculate_route(payload: RouteRequest, db: Session = Depends(get_db)):
    refresh_stale_locations(db)
    result = route_engine.calculate_safe_route(
        db=db,
        origin_node_id=payload.origin_node_id,
        destination_node_id=payload.destination_node_id,
        avoid_blocked=payload.avoid_blocked
    )
    return result
