"""
External Source Connection Router.
Manages configurations and health checks for official forum and community platform connectors.
"""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SourceConfig
from ..schemas import SourceConfigUpdate
from ..services.ingestion_service import ingestion_service

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get("/status")
def get_source_status(db: Session = Depends(get_db)):
    return ingestion_service.get_source_status(db)


@router.post("/configure")
def configure_source(payload: SourceConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(SourceConfig).filter(SourceConfig.source_name == "reddit").first()
    if not config:
        config = SourceConfig(source_name="reddit")
        db.add(config)

    config.enabled = payload.enabled
    config.poll_interval_sec = payload.poll_interval_sec
    config.config_json = f'{{"client_id": "{payload.client_id or ""}", "user_agent": "{payload.user_agent or ""}"}}'
    config.status_message = "Credentials saved. Connection requires valid API key." if payload.client_id else "Not connected - missing credentials"
    db.commit()
    return {"status": "success", "message": "Source configuration updated"}
