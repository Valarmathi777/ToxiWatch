"""
Dashboard Statistics API Router.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.stats_service import stats_service
from ..schemas import DashboardStats

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Fetch live aggregated dashboard statistics."""
    return stats_service.get_dashboard_stats(db)
