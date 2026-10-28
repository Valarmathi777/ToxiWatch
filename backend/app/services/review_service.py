"""
Human Review and Moderation Triage Service.
Allows administrators and analysts to audit, confirm, reject, or correct
model predictions, adding notes and updating review statuses.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..models import Post
from ..auth import log_admin_action


class ReviewService:
    def get_review_queue(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 25
    ) -> Dict[str, Any]:
        """Fetch posts requiring human review."""
        query = db.query(Post)
        if status_filter:
            query = query.filter(Post.review_status == status_filter)
        else:
            query = query.filter(Post.requires_review == True)

        if category_filter:
            query = query.filter(Post.predicted_category == category_filter)

        total = query.count()
        posts = query.order_by(Post.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "posts": [p.to_dict() for p in posts]
        }

    def process_review_decision(
        self,
        db: Session,
        post_id: int,
        review_status: str,  # 'confirmed', 'rejected', 'reviewed'
        reviewer_email: str,
        confirmed_category: Optional[str] = None,
        reviewer_notes: Optional[str] = None
    ) -> Optional[Post]:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return None

        post.review_status = review_status
        post.reviewed_by = reviewer_email
        if reviewer_notes:
            post.reviewer_notes = reviewer_notes
        if confirmed_category:
            post.predicted_category = confirmed_category

        post.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(post)

        # Log audit trail
        log_admin_action(
            db=db,
            user_email=reviewer_email,
            action="REVIEW_DECISION",
            target_type="Post",
            target_id=str(post_id),
            details=f"Status: {review_status}, Category: {confirmed_category or post.predicted_category}, Notes: {reviewer_notes}"
        )

        return post


review_service = ReviewService()
