"""
notifications.py
================
SPAS Notification API Routes

Endpoints:
    GET   /notifications/{student_id}              — student notifications
    PATCH /notifications/{student_id}/{notif_id}   — resolve notification
    GET   /notifications/admin/all                 — all unresolved (admin)
"""

from fastapi        import APIRouter, Depends, status
from sqlalchemy.orm import Session
import uuid

from app.api.deps                    import get_db, require_role
from app.schemas.notification        import (
    NotificationRecord,
    NotificationListResponse,
    AllNotificationsResponse,
)
from app.services.notification_service import (
    get_student_notifications,
    resolve_notification,
    get_all_unresolved_notifications,
)

router = APIRouter(
    prefix = "/notifications",
    tags   = ["Notifications"],
)


# ── GET /notifications/{student_id} ───────────────────────────────────────────

@router.get(
    "/{student_id}",
    response_model = NotificationListResponse,
    status_code    = status.HTTP_200_OK,
    summary        = "Get all notifications for a student",
)
def get_notifications(
    student_id     : uuid.UUID,
    unresolved_only: bool    = False,
    db             : Session = Depends(get_db),
    _user                    = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    records = get_student_notifications(
        db              = db,
        student_id      = student_id,
        unresolved_only = unresolved_only,
    )

    unresolved_count = sum(1 for n in records if not n.is_resolved)

    return NotificationListResponse(
        student_id       = student_id,
        total            = len(records),
        unresolved_count = unresolved_count,
        notifications    = [
            NotificationRecord(
                id                = n.id,
                notification_type = n.notification_type,
                severity          = n.severity,
                message           = n.message,
                is_resolved       = n.is_resolved,
                created_at        = n.created_at,
            )
            for n in records
        ],
    )


# ── PATCH /notifications/{student_id}/{notification_id} ───────────────────────

@router.patch(
    "/{student_id}/{notification_id}",
    response_model = NotificationRecord,
    status_code    = status.HTTP_200_OK,
    summary        = "Mark a notification as resolved",
)
def resolve(
    student_id      : uuid.UUID,
    notification_id : uuid.UUID,
    db              : Session = Depends(get_db),
    _user                     = Depends(require_role("ADMIN", "TEACHER")),
):
    notif = resolve_notification(
        db              = db,
        notification_id = notification_id,
        student_id      = student_id,
    )

    return NotificationRecord(
        id                = notif.id,
        notification_type = notif.notification_type,
        severity          = notif.severity,
        message           = notif.message,
        is_resolved       = notif.is_resolved,
        created_at        = notif.created_at,
    )


# ── GET /notifications/admin/all ──────────────────────────────────────────────

@router.get(
    "/admin/all",
    response_model = AllNotificationsResponse,
    status_code    = status.HTTP_200_OK,
    summary        = "Get all unresolved notifications — admin only",
)
def get_all_alerts(
    db   : Session = Depends(get_db),
    _user          = Depends(require_role("ADMIN")),
):
    records = get_all_unresolved_notifications(db=db)

    return AllNotificationsResponse(
        total         = len(records),
        notifications = [
            NotificationRecord(
                id                = n.id,
                notification_type = n.notification_type,
                severity          = n.severity,
                message           = n.message,
                is_resolved       = n.is_resolved,
                created_at        = n.created_at,
            )
            for n in records
        ],
    )