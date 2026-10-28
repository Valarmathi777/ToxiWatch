"""
Models Performance and Management API Router.
Provides model version tracking, comparative evaluation metrics, and retraining triggers.
"""

import os
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..ml.trainer import METRICS_PATH, ModelTrainer
from ..ml.inference import engine
from ..models import ModelVersion, User
from ..auth import require_admin

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("/metrics")
def get_model_metrics():
    """Retrieve full evaluation report for Models A, B, C, and D."""
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(status_code=404, detail="No evaluation report found. Train models first.")
    
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)
    return metrics


def _run_retraining():
    trainer = ModelTrainer(settings.DATASET_PATH, model_version="v1.1.0")
    trainer.train_and_evaluate()
    # Reload inference engine
    engine._load_models()


@router.post("/retrain")
def trigger_retrain(background_tasks: BackgroundTasks):
    """Triggers asynchronous retraining of all 4 models."""
    background_tasks.add_task(_run_retraining)
    return {
        "status": "initiated",
        "message": "Retraining job dispatched. Models will update upon completion."
    }
