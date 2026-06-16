"""
recommendations.py
==================
SPAS Recommendation API Routes

Endpoints:
    GET   /recommendations/{student_id}          — get all recommendations
    PATCH /recommendations/{student_id}/{rec_id} — mark as read
"""

from fastapi        import APIRouter, Depends, status
from sqlalchemy.orm import Session
import uuid

from app.api.deps                     import get_db, require_role
from app.schemas.recommendation       import (
    RecommendationListResponse,
    RecommendationRecord,
)
from app.services.recommendation_service import (
    get_student_recommendations,
    mark_recommendation_as_read,
)

router = APIRouter(
    prefix = "/recommendations",
    tags   = ["Recommendations"],
)


# ── GET /recommendations/{student_id} ─────────────────────────────────────────

@router.get(
    "/{student_id}",
    response_model = RecommendationListResponse,
    status_code    = status.HTTP_200_OK,
    summary        = "Get all recommendations for a student",
    description    = (
        "Returns all recommendations for a student. "
        "Unread recommendations appear first, then sorted by most recent."
    ),
)
def get_recommendations(
    student_id: uuid.UUID,
    db        : Session = Depends(get_db),
    _user               = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    records = get_student_recommendations(
        db         = db,
        student_id = student_id,
    )

    unread_count = sum(1 for r in records if not r.is_read)

    return RecommendationListResponse(
        student_id      = student_id,
        total           = len(records),
        unread_count    = unread_count,
        recommendations = [
            RecommendationRecord(
                id                  = r.id,
                recommendation_type = r.recommendation_type,
                message             = r.message,
                priority            = r.priority,
                is_read             = r.is_read,
                created_at          = r.created_at,
            )
            for r in records
        ],
    )


# ── PATCH /recommendations/{student_id}/{rec_id} ──────────────────────────────

@router.patch(
    "/{student_id}/{recommendation_id}",
    response_model = RecommendationRecord,
    status_code    = status.HTTP_200_OK,
    summary        = "Mark a recommendation as read",
    description    = "Marks a single recommendation as read for a student.",
)
def mark_as_read(
    student_id        : uuid.UUID,
    recommendation_id : uuid.UUID,
    db                : Session = Depends(get_db),
    _user                       = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    rec = mark_recommendation_as_read(
        db                = db,
        recommendation_id = recommendation_id,
        student_id        = student_id,
    )

    return RecommendationRecord(
        id                  = rec.id,
        recommendation_type = rec.recommendation_type,
        message             = rec.message,
        priority            = rec.priority,
        is_read             = rec.is_read,
        created_at          = rec.created_at,
    )