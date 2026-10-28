"""
Pydantic Data Schemas for Request/Response validation.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str]
    last_login: Optional[str]


# ---------------------------------------------------------
# Prediction & Inference Schemas
# ---------------------------------------------------------
class PredictionRequest(BaseModel):
    comment: str = Field(..., min_length=1, max_length=5000, description="Comment text to analyze")
    conversation_context: Optional[str] = Field(None, max_length=2000, description="Optional conversation context")
    confidence_threshold: Optional[float] = Field(0.55, ge=0.0, le=1.0)


class ExplanationItem(BaseModel):
    term: str
    importance: float
    impact: str


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    comment: str
    conversation_context: Optional[str] = None
    cleaned_comment: str
    cleaned_context: Optional[str] = None
    predicted_category: str
    category_probabilities: Dict[str, float]
    confidence: float
    uncertainty: float
    hate_speech: bool
    hate_speech_probability: float
    toxicity_score: float
    baseline_category: Optional[str] = None
    baseline_confidence: Optional[float] = None
    requires_review: bool
    review_reason: Optional[str] = None
    explanations: List[Dict[str, Any]] = []
    model_version: str
    timestamp: str


# ---------------------------------------------------------
# Post Schemas
# ---------------------------------------------------------
class PostOut(BaseModel):
    id: int
    comment_id: Optional[str] = None
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    comment: str
    conversation_context: Optional[str] = None
    cleaned_comment: Optional[str] = None
    cleaned_context: Optional[str] = None
    source: str
    original_category: Optional[str] = None
    predicted_category: str
    toxicity_score: float
    hate_speech: bool
    hate_speech_probability: float
    confidence: float
    uncertainty: float
    requires_review: bool
    review_reason: Optional[str] = None
    review_status: str
    reviewed_by: Optional[str] = None
    reviewer_notes: Optional[str] = None
    is_simulated: bool
    text_hash: str
    created_at: Optional[str]
    updated_at: Optional[str]


class PostReviewUpdate(BaseModel):
    review_status: str = Field(..., description="'reviewed', 'confirmed', 'rejected'")
    confirmed_category: Optional[str] = None
    reviewer_notes: Optional[str] = None


# ---------------------------------------------------------
# Dashboard Statistics Schema
# ---------------------------------------------------------
class DashboardStats(BaseModel):
    total_posts: int
    processed_posts: int
    awaiting_review: int
    predicted_toxic: int
    predicted_hate_speech: int
    confirmed_incidents: int
    average_toxicity_score: float
    error_count: int
    category_counts: Dict[str, int]
    source_counts: Dict[str, int]
    timeline_posts: List[Dict[str, Any]]
    timeline_toxicity: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]
    top_phrases: List[Dict[str, Any]]


# ---------------------------------------------------------
# Trend & Alert Schemas
# ---------------------------------------------------------
class TrendEventOut(BaseModel):
    id: int
    phrase: str
    occurrence_count: int
    baseline_count: int
    burst_ratio: float
    severity: str
    sample_posts: Optional[str]
    detected_at: Optional[str]
    is_active: bool


class AlertOut(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    source: str
    status: str
    detected_at: Optional[str]
    acknowledged_by: Optional[str] = None
    resolved_by: Optional[str] = None
    metadata_json: Optional[str] = None


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description="'acknowledged' or 'resolved'")


# ---------------------------------------------------------
# Simulation Schemas
# ---------------------------------------------------------
class SimulationConfig(BaseModel):
    status: str  # 'running', 'paused', 'stopped'
    speed_seconds: float = 2.0
    include_toxic_ratio: float = 0.5


# ---------------------------------------------------------
# Source Configuration Schemas
# ---------------------------------------------------------
class SourceConfigUpdate(BaseModel):
    enabled: bool
    poll_interval_sec: int = 60
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    user_agent: Optional[str] = None
    subreddit_or_query: Optional[str] = None
