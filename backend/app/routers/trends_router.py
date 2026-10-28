"""
Trends and Alerts API Router.
Handles emerging toxic phrase detection, burst calculations, and alert lifecycle management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.trend_service import trend_service
from ..schemas import AlertStatusUpdate
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/trends", tags=["Trends & Alerts"])


@router.get("")
def get_emerging_trends(
    window_minutes: int = 60,
    min_occurrences: int = 2,
    db: Session = Depends(get_db)
):
    """Detect and return emerging toxic trends in current time window."""
    return trend_service.detect_trends(db, current_window_minutes=window_minutes, min_occurrences=min_occurrences)


@router.get("/alerts")
def get_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch system alerts filtered by status ('active', 'acknowledged', 'resolved')."""
    alerts = trend_service.get_alerts(db, status_filter=status)
    return [a.to_dict() for a in alerts]


@router.post("/alerts/{alert_id}/status")
def update_alert_status(
    alert_id: int,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """Acknowledge or resolve an active alert."""
    updated = trend_service.update_alert_status(
        db=db,
        alert_id=alert_id,
        new_status=payload.status,
        admin_user="system_admin"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return updated.to_dict()
