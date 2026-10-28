"""
Toxic Trend Analysis and Early Warning Alert Service.
Extracts n-grams from sliding time windows, calculates burst ratios against baseline,
identifies emerging toxic clusters, and dispatches actionable alerts.
"""

import re
import json
from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..models import Post, TrendEvent, Alert
from ..ml.preprocessor import default_preprocessor


STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'this', 'that', 'it', 'you', 'i', 'he', 'she', 'they',
    'we', 'my', 'your', 'his', 'her', 'their', 'our', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'if', 'as', 'not', 'no', 'so', 'up', 'out', 'url', 'user', 'cmt'
}


class TrendService:
    def __init__(self):
        self.preprocessor = default_preprocessor

    def _extract_phrases(self, texts: List[str], min_length: int = 3) -> Counter:
        """Extract unigrams and bigrams filtering out stopwords."""
        counts = Counter()
        for t in texts:
            cleaned = self.preprocessor.clean(t).lower()
            words = [w for w in re.findall(r'\b[a-z]{3,}\b', cleaned) if w not in STOPWORDS]
            
            # Unigrams
            for w in words:
                counts[w] += 1
            
            # Bigrams
            for i in range(len(words) - 1):
                phrase = f"{words[i]} {words[i+1]}"
                counts[phrase] += 1

        return counts

    def detect_trends(
        self,
        db: Session,
        current_window_minutes: int = 60,
        min_occurrences: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Calculates emerging toxic terms and phrases by comparing recent window
        against baseline history.
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=current_window_minutes)

        # Get recent toxic and hate speech posts
        recent_toxic_posts = db.query(Post).filter(
            Post.created_at >= window_start,
            Post.predicted_category.in_(['hate_speech', 'harmful_toxic', 'offensive'])
        ).order_by(Post.created_at.desc()).all()

        # If not enough posts in the last hour, take the latest 50 toxic posts as current window
        if len(recent_toxic_posts) < 5:
            recent_toxic_posts = db.query(Post).filter(
                Post.predicted_category.in_(['hate_speech', 'harmful_toxic', 'offensive'])
            ).order_by(Post.created_at.desc()).limit(50).all()

        if not recent_toxic_posts:
            return []

        # Get baseline posts (older posts or normal posts)
        baseline_posts = db.query(Post).filter(
            Post.created_at < window_start
        ).order_by(Post.created_at.desc()).limit(200).all()

        recent_texts = [p.comment for p in recent_toxic_posts]
        baseline_texts = [p.comment for p in baseline_posts] if baseline_posts else []

        recent_counts = self._extract_phrases(recent_texts)
        baseline_counts = self._extract_phrases(baseline_texts)

        trends = []
        for phrase, curr_count in recent_counts.most_common(20):
            if curr_count < min_occurrences:
                continue

            base_count = baseline_counts.get(phrase, 0)
            burst_ratio = (curr_count / max(1, base_count))

            # Determine severity
            if burst_ratio >= 3.0 or curr_count >= 10:
                severity = "critical" if any(p in phrase for p in ["purged", "inferior", "destroy", "die", "kill"]) else "high"
            elif burst_ratio >= 2.0:
                severity = "medium"
            else:
                severity = "low"

            # Find matching sample posts
            samples = [
                p.comment for p in recent_toxic_posts
                if phrase in p.comment.lower()
            ][:3]

            trends.append({
                "phrase": phrase,
                "occurrence_count": curr_count,
                "baseline_count": base_count,
                "burst_ratio": round(burst_ratio, 2),
                "severity": severity,
                "sample_posts": samples,
                "detected_at": now.isoformat()
            })

            # Check if this trend is already recorded or if we should register a new TrendEvent
            existing_trend = db.query(TrendEvent).filter(
                TrendEvent.phrase == phrase,
                TrendEvent.is_active == True
            ).first()

            if not existing_trend and (severity in ["high", "critical"] or curr_count >= 4):
                new_trend = TrendEvent(
                    phrase=phrase,
                    occurrence_count=curr_count,
                    baseline_count=base_count,
                    burst_ratio=burst_ratio,
                    severity=severity,
                    sample_posts=json.dumps(samples),
                    detected_at=now,
                    is_active=True
                )
                db.add(new_trend)

                # Generate alert for high/critical trends
                alert = Alert(
                    title=f"Emerging Toxic Trend: '{phrase.title()}'",
                    description=f"Identified surge in phrase '{phrase}' ({curr_count} occurrences, burst ratio {burst_ratio:.1f}x) across toxic discussions.",
                    severity=severity,
                    source="Trend Detection Engine",
                    status="active",
                    detected_at=now,
                    metadata_json=json.dumps({"phrase": phrase, "samples": samples})
                )
                db.add(alert)
                db.commit()

        return trends

    def get_alerts(self, db: Session, status_filter: Optional[str] = None) -> List[Alert]:
        query = db.query(Alert)
        if status_filter:
            query = query.filter(Alert.status == status_filter)
        return query.order_by(Alert.detected_at.desc()).all()

    def update_alert_status(self, db: Session, alert_id: int, new_status: str, admin_user: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        alert.status = new_status
        if new_status == "acknowledged":
            alert.acknowledged_by = admin_user
        elif new_status == "resolved":
            alert.resolved_by = admin_user

        db.commit()
        db.refresh(alert)
        return alert


trend_service = TrendService()
