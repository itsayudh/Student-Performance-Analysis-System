"""
schemas/notification.py
=======================
Pydantic schemas for notification endpoints.
"""

from pydantic   import BaseModel
from typing     import List, Optional
from datetime   import datetime
import uuid


class NotificationRecord(BaseModel):
    """Single notification record returned from API."""
    id                : uuid.UUID
    notification_type : str
    severity          : str
    message           : str
    is_resolved       : bool
    created_at        : datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """All notifications for a student."""
    student_id         : uuid.UUID
    total              : int
    unresolved_count   : int
    notifications      : List[NotificationRecord]


class AllNotificationsResponse(BaseModel):
    """All unresolved notifications — for admin dashboard."""
    total         : int
    notifications : List[NotificationRecord]