from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.alert import Alert
from app.models.location import Location
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest
from app.services.alert_service import acknowledge_alert

router = APIRouter(tags=["Alerts"])

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledged state"),
    severity: Optional[str] = Query(None, description="Filter by severity (INFO, WARNING, CRITICAL)"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == acknowledged)
    if severity:
        query = query.filter(Alert.severity == severity.upper())

    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    
    # Enrich with location names
    loc_names = {loc.id: loc.name for loc in db.query(Location).all()}
    results = []
    for a in alerts:
        res = AlertResponse.model_validate(a)
        res.location_name = loc_names.get(a.location_id, a.location_id)
        results.append(res)

    return results

@router.post("/alerts/{id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert_endpoint(
    id: int,
    payload: AlertAcknowledgeRequest = AlertAcknowledgeRequest(),
    db: Session = Depends(get_db)
):
    ack_alert = acknowledge_alert(db=db, alert_id=id, operator_name=payload.acknowledged_by or "Admin Operator")
    if not ack_alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found")
    
    loc = db.query(Location).filter(Location.id == ack_alert.location_id).first()
    res = AlertResponse.model_validate(ack_alert)
    res.location_name = loc.name if loc else ack_alert.location_id
    return res

@router.get("/alerts/summary")
def get_alerts_summary(db: Session = Depends(get_db)):
    unacked = db.query(Alert).filter(Alert.is_acknowledged == False).all()
    total_unacked = len(unacked)
    critical = sum(1 for a in unacked if a.severity == "CRITICAL")
    warning = sum(1 for a in unacked if a.severity == "WARNING")
    info = sum(1 for a in unacked if a.severity == "INFO")

    return {
        "total_unacknowledged": total_unacked,
        "critical_count": critical,
        "warning_count": warning,
        "info_count": info
    }
