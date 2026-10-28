"""
SQLAlchemy Database Models for Hate & Toxicity Sentinel Platform.
Defines schemas for Users, Posts, AuditLogs, Trends, Alerts, Dataset Imports,
Model Versions, and Source Configurations.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="admin", nullable=False)  # 'admin' or 'analyst'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(String(100), index=True, nullable=True)
    conversation_id = Column(String(100), index=True, nullable=True)
    user_id = Column(String(100), index=True, nullable=True)
    
    comment = Column(Text, nullable=False)
    conversation_context = Column(Text, nullable=True)
    cleaned_comment = Column(Text, nullable=True)
    cleaned_context = Column(Text, nullable=True)
    
    source = Column(String(50), default="dataset", index=True, nullable=False)  # 'dataset', 'simulation', 'reddit', 'api'
    original_category = Column(String(50), nullable=True)
    predicted_category = Column(String(50), index=True, nullable=False)
    
    toxicity_score = Column(Float, index=True, default=0.0, nullable=False)
    hate_speech = Column(Boolean, index=True, default=False, nullable=False)
    hate_speech_probability = Column(Float, default=0.0, nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)
    uncertainty = Column(Float, default=0.0, nullable=False)
    
    requires_review = Column(Boolean, index=True, default=False, nullable=False)
    review_reason = Column(String(255), nullable=True)
    review_status = Column(String(50), default="pending", index=True, nullable=False)  # 'pending', 'reviewed', 'confirmed', 'rejected'
    reviewed_by = Column(String(100), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    
    is_simulated = Column(Boolean, default=False, index=True, nullable=False)
    text_hash = Column(String(64), index=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "comment_id": self.comment_id,
            "conversation_id": self.conversation_id,
            "user_id": self.user_id,
            "comment": self.comment,
            "conversation_context": self.conversation_context,
            "cleaned_comment": self.cleaned_comment,
            "cleaned_context": self.cleaned_context,
            "source": self.source,
            "original_category": self.original_category,
            "predicted_category": self.predicted_category,
            "toxicity_score": round(self.toxicity_score, 4),
            "hate_speech": self.hate_speech,
            "hate_speech_probability": round(self.hate_speech_probability, 4),
            "confidence": round(self.confidence, 4),
            "uncertainty": round(self.uncertainty, 4),
            "requires_review": self.requires_review,
            "review_reason": self.review_reason,
            "review_status": self.review_status,
            "reviewed_by": self.reviewed_by,
            "reviewer_notes": self.reviewer_notes,
            "is_simulated": self.is_simulated,
            "text_hash": self.text_hash,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TrendEvent(Base):
    __tablename__ = "trend_events"

    id = Column(Integer, primary_key=True, index=True)
    phrase = Column(String(100), index=True, nullable=False)
    occurrence_count = Column(Integer, default=0, nullable=False)
    baseline_count = Column(Integer, default=0, nullable=False)
    burst_ratio = Column(Float, default=1.0, nullable=False)
    severity = Column(String(20), default="medium", nullable=False)  # 'low', 'medium', 'high', 'critical'
    sample_posts = Column(Text, nullable=True)  # JSON string
    detected_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    is_active = Column(Boolean, default=True, index=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "phrase": self.phrase,
            "occurrence_count": self.occurrence_count,
            "baseline_count": self.baseline_count,
            "burst_ratio": round(self.burst_ratio, 2),
            "severity": self.severity,
            "sample_posts": self.sample_posts,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "is_active": self.is_active
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="high", index=True, nullable=False)  # 'low', 'medium', 'high', 'critical'
    source = Column(String(50), default="Trend Monitor", nullable=False)
    status = Column(String(20), default="active", index=True, nullable=False)  # 'active', 'acknowledged', 'resolved'
    detected_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    acknowledged_by = Column(String(100), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "source": self.source,
            "status": self.status,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "acknowledged_by": self.acknowledged_by,
            "resolved_by": self.resolved_by,
            "metadata_json": self.metadata_json
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), index=True, nullable=False)
    action = Column(String(100), index=True, nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_email": self.user_email,
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    imported_rows = Column(Integer, default=0, nullable=False)
    duplicates_skipped = Column(Integer, default=0, nullable=False)
    invalid_rows = Column(Integer, default=0, nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    summary_json = Column(Text, nullable=True)
    imported_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "total_rows": self.total_rows,
            "imported_rows": self.imported_rows,
            "duplicates_skipped": self.duplicates_skipped,
            "invalid_rows": self.invalid_rows,
            "file_size_bytes": self.file_size_bytes,
            "summary_json": self.summary_json,
            "imported_by": self.imported_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, index=True, nullable=False)
    algorithm = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=True)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "version_tag": self.version_tag,
            "algorithm": self.algorithm,
            "accuracy": round(self.accuracy, 4),
            "macro_f1": round(self.macro_f1, 4),
            "r2_score": round(self.r2_score, 4) if self.r2_score is not None else None,
            "metrics_json": self.metrics_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active
        }


class SourceConfig(Base):
    __tablename__ = "source_configs"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=False, nullable=False)
    poll_interval_sec = Column(Integer, default=60, nullable=False)
    last_fetch_at = Column(DateTime, nullable=True)
    status_message = Column(String(255), default="Not connected", nullable=False)
    config_json = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "source_name": self.source_name,
            "enabled": self.enabled,
            "poll_interval_sec": self.poll_interval_sec,
            "last_fetch_at": self.last_fetch_at.isoformat() if self.last_fetch_at else None,
            "status_message": self.status_message,
            "config_json": self.config_json
        }
