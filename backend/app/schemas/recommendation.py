"""
schemas/recommendation.py
=========================
Pydantic schemas for recommendation endpoints.
"""

from pydantic   import BaseModel, Field
from typing     import List
from datetime   import datetime
import uuid


class RecommendationRecord(BaseModel):
    """Single recommendation returned from the API."""
    id                  : uuid.UUID
    recommendation_type : str
    message             : str
    priority            : str
    is_read             : bool
    created_at          : datetime

    class Config:
        from_attributes = True


class RecommendationListResponse(BaseModel):
    """All recommendations for a student."""
    student_id      : uuid.UUID
    total           : int
    unread_count    : int
    recommendations : List[RecommendationRecord]


class MarkReadRequest(BaseModel):
    """Request body for marking a recommendation as read."""
    recommendation_id: uuid.UUID