"""
Human Review & Moderation Queue API Router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.review_service import review_service
from ..schemas import PostReviewUpdate
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/reviews", tags=["Human Review"])


@router.get("/queue")
def get_review_queue(
    status: Optional[str] = Query(None, description="Filter by status: 'pending', 'reviewed', 'confirmed', 'rejected'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return review_service.get_review_queue(
        db=db,
        status_filter=status,
        category_filter=category,
        page=page,
        page_size=page_size
    )


@router.post("/{post_id}")
def submit_review_decision(
    post_id: int,
    payload: PostReviewUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    updated_post = review_service.process_review_decision(
        db=db,
        post_id=post_id,
        review_status=payload.review_status,
        reviewer_email="admin@sentinel.ai",
        confirmed_category=payload.confirmed_category,
        reviewer_notes=payload.reviewer_notes
    )
    if not updated_post:
        raise HTTPException(status_code=404, detail="Post not found")
    return updated_post.to_dict()
