"""
Prediction and Inference API Router.
Provides real-time model inference, risk classification, and explainability.
"""

from fastapi import APIRouter, HTTPException, Depends
from ..schemas import PredictionRequest, PredictionResponse
from ..ml.inference import engine
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/predict", tags=["Inference"])


@router.post("", response_model=PredictionResponse)
def predict_content(
    payload: PredictionRequest,
    # Allow public access for demonstration / testing or with token
):
    try:
        result = engine.predict(
            comment=payload.comment,
            conversation_context=payload.conversation_context,
            confidence_threshold=payload.confidence_threshold or 0.55
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
