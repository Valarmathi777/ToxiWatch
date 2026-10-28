"""
Dashboard Statistics and Metrics Aggregation Service.
Computes live KPIs, time-series distributions, category breakdowns,
confidence buckets, and source activity.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Post, TrendEvent, Alert


class StatsService:
    def get_dashboard_stats(self, db: Session, days: int = 7) -> Dict[str, Any]:
        """Calculates all key monitoring metrics from database."""
        total_posts = db.query(Post).count()
        processed_posts = total_posts
        awaiting_review = db.query(Post).filter(Post.review_status == "pending", Post.requires_review == True).count()
        predicted_toxic = db.query(Post).filter(Post.predicted_category.in_(['hate_speech', 'harmful_toxic', 'offensive', 'friendly_toxic'])).count()
        predicted_hate_speech = db.query(Post).filter(Post.hate_speech == True).count()
        confirmed_incidents = db.query(Post).filter(Post.review_status == "confirmed").count()
        
        avg_tox = db.query(func.avg(Post.toxicity_score)).scalar()
        average_toxicity_score = round(float(avg_tox), 4) if avg_tox is not None else 0.0

        # Category Breakdown
        cat_counts_query = db.query(Post.predicted_category, func.count(Post.id)).group_by(Post.predicted_category).all()
        category_counts = {cat: count for cat, count in cat_counts_query}

        # Ensure all standard categories appear
        for std_cat in ['normal', 'offensive', 'friendly_toxic', 'harmful_toxic', 'hate_speech']:
            if std_cat not in category_counts:
                category_counts[std_cat] = 0

        # Source Breakdown
        source_counts_query = db.query(Post.source, func.count(Post.id)).group_by(Post.source).all()
        source_counts = {src: count for src, count in source_counts_query}

        # Timeline trends (last 7 intervals or grouped by date)
        # For sqlite / postgres portability, query latest 100 posts or sample timeline
        # Build timeline by splitting all posts into 10 equal buckets by ID
        timeline_posts = []
        timeline_toxicity = []
        if total_posts > 0:
            bucket_size = max(1, total_posts // 10)
            for i in range(10):
                offset = i * bucket_size
                chunk = db.query(Post.created_at, Post.toxicity_score, Post.hate_speech).offset(offset).limit(bucket_size).all()
                if not chunk:
                    break
                total_in_chunk = len(chunk)
                hate_in_chunk = sum(1 for p in chunk if p[2])
                avg_tox_chunk = sum(p[1] for p in chunk) / max(1, total_in_chunk)
                time_label = chunk[-1][0].strftime("%H:%M:%S") if chunk[-1][0] else f"T-{i}"
                timeline_posts.append({"timestamp": time_label, "volume": total_in_chunk, "hate_speech": hate_in_chunk})
                timeline_toxicity.append({"timestamp": time_label, "average_score": round(avg_tox_chunk, 3)})

        # Confidence distribution buckets (0-0.5, 0.5-0.7, 0.7-0.9, 0.9-1.0)
        c1 = db.query(Post).filter(Post.confidence < 0.5).count()
        c2 = db.query(Post).filter(Post.confidence >= 0.5, Post.confidence < 0.7).count()
        c3 = db.query(Post).filter(Post.confidence >= 0.7, Post.confidence < 0.9).count()
        c4 = db.query(Post).filter(Post.confidence >= 0.9).count()
        confidence_distribution = [
            {"range": "0.0 - 0.5", "count": c1},
            {"range": "0.5 - 0.7", "count": c2},
            {"range": "0.7 - 0.9", "count": c3},
            {"range": "0.9 - 1.0", "count": c4},
        ]

        # Top phrases from active trends
        active_trends = db.query(TrendEvent).order_by(TrendEvent.occurrence_count.desc()).limit(7).all()
        top_phrases = [
            {"phrase": t.phrase, "count": t.occurrence_count, "burst": round(t.burst_ratio, 1), "severity": t.severity}
            for t in active_trends
        ]

        return {
            "total_posts": total_posts,
            "processed_posts": processed_posts,
            "awaiting_review": awaiting_review,
            "predicted_toxic": predicted_toxic,
            "predicted_hate_speech": predicted_hate_speech,
            "confirmed_incidents": confirmed_incidents,
            "average_toxicity_score": average_toxicity_score,
            "error_count": 0,
            "category_counts": category_counts,
            "source_counts": source_counts,
            "timeline_posts": timeline_posts,
            "timeline_toxicity": timeline_toxicity,
            "confidence_distribution": confidence_distribution,
            "top_phrases": top_phrases
        }


stats_service = StatsService()
