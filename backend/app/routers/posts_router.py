"""
Posts API Router.
Handles post querying, searching, multi-criteria filtering, pagination, and CSV export.
"""

import io
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Post
from ..schemas import PostOut
from ..auth import get_current_user
from ..ml.inference import engine

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=dict)
def get_posts(
    search: Optional[str] = Query(None, description="Search query across comments"),
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(None, description="Filter by source"),
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    hate_speech: Optional[bool] = Query(None, description="Filter by hate speech boolean"),
    min_toxicity: Optional[float] = Query(0.0, description="Minimum toxicity score"),
    max_toxicity: Optional[float] = Query(1.0, description="Maximum toxicity score"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Post.comment.ilike(term), Post.conversation_context.ilike(term)))

    if category and category != "all":
        query = query.filter(Post.predicted_category == category)

    if source and source != "all":
        query = query.filter(Post.source == source)

    if review_status and review_status != "all":
        query = query.filter(Post.review_status == review_status)

    if hate_speech is not None:
        query = query.filter(Post.hate_speech == hate_speech)

    if min_toxicity is not None and min_toxicity > 0.0:
        query = query.filter(Post.toxicity_score >= min_toxicity)

    if max_toxicity is not None and max_toxicity < 1.0:
        query = query.filter(Post.toxicity_score <= max_toxicity)

    # Sorting
    sort_column = getattr(Post, sort_by, Post.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "items": [item.to_dict() for item in items]
    }


@router.get("/export/csv")
def export_posts_csv(
    search: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    review_status: Optional[str] = None,
    hate_speech: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    if search:
        query = query.filter(Post.comment.ilike(f"%{search}%"))
    if category and category != "all":
        query = query.filter(Post.predicted_category == category)
    if source and source != "all":
        query = query.filter(Post.source == source)
    if review_status and review_status != "all":
        query = query.filter(Post.review_status == review_status)
    if hate_speech is not None:
        query = query.filter(Post.hate_speech == hate_speech)

    posts = query.order_by(Post.created_at.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Comment ID", "Source", "Comment", "Conversation Context",
        "Predicted Category", "Toxicity Score", "Hate Speech", "Confidence",
        "Review Status", "Reviewed By", "Reviewer Notes", "Created At"
    ])

    for p in posts:
        writer.writerow([
            p.id, p.comment_id, p.source, p.comment, p.conversation_context,
            p.predicted_category, p.toxicity_score, p.hate_speech, p.confidence,
            p.review_status, p.reviewed_by or "", p.reviewer_notes or "", p.created_at
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=posts_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/{post_id}")
def get_post_detail(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Generate live feature explanation for this post
    contextual_text = engine.preprocessor.build_context_text(post.comment, post.conversation_context)
    explanations = engine.explain_prediction(contextual_text, engine.model_c, top_n=5) if engine.is_ready else []

    data = post.to_dict()
    data["explanations"] = explanations
    return data
