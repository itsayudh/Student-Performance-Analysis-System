"""
notification_service.py
=======================
SPAS Early Warning Notification Service

Generates and saves early warning alerts based on:
1. Rule-based checks  — attendance, GPA, quiz, consecutive absences
2. ML-based checks    — failure probability from prediction model

Alert severity levels (from Section 3.9 of SPAS documentation):
    LOW      — minor concern, informational
    MEDIUM   — needs attention
    HIGH     — urgent, teacher + admin notified
    CRITICAL — immediate action required, all parties notified

Called automatically after every prediction in prediction_service.py
"""

import uuid
from datetime       import datetime, timezone
from typing         import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification


# ── Notification type constants ────────────────────────────────────────────────
TYPE_EARLY_WARNING = "EARLY_WARNING"
TYPE_SYSTEM        = "SYSTEM"

# ── Severity constants ─────────────────────────────────────────────────────────
SEV_LOW      = "LOW"
SEV_MEDIUM   = "MEDIUM"
SEV_HIGH     = "HIGH"
SEV_CRITICAL = "CRITICAL"

# ── Thresholds from Section 3.9 of SPAS documentation ─────────────────────────
ATTENDANCE_CRITICAL       = 40.0    # CRITICAL alert
ATTENDANCE_HIGH           = 60.0    # HIGH alert
ATTENDANCE_MEDIUM         = 75.0    # MEDIUM alert
GPA_MEDIUM                = 2.0     # MEDIUM alert
QUIZ_HIGH                 = 50.0    # HIGH alert
ASSIGNMENT_HIGH           = 60.0    # HIGH alert
MIDTERM_HIGH              = 50.0    # HIGH alert
FAILURE_PROB_HIGH         = 0.55    # HIGH alert
FAILURE_PROB_CRITICAL     = 0.75    # CRITICAL alert


# ── Rule-based alert generator ─────────────────────────────────────────────────

def _generate_alerts(
    raw_input : Dict[str, Any],
    ml_result : Dict[str, Any],
) -> List[Dict[str, str]]:
    """
    Check all rule-based and ML-based conditions and
    generate alert dicts for each triggered condition.

    Args:
        raw_input : raw feature values from API request
        ml_result : ML prediction output from predict_student()

    Returns:
        List of alert dicts with keys:
            notification_type, severity, message
    """
    alerts = []

    attendance = raw_input["attendance_percentage"]
    quiz_avg   = raw_input["quiz_score_avg"]
    assign_avg = raw_input["assignment_score_avg"]
    midterm    = raw_input["midterm_score"]
    gpa        = raw_input["historical_gpa"]
    fail_prob  = ml_result["failure_probability"]
    risk_level = ml_result["risk_level"]
    pred_score = ml_result["predicted_score"]

    # ── Attendance alerts ──────────────────────────────────────────────────────
    if attendance < ATTENDANCE_CRITICAL:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_CRITICAL,
            "message"          : (
                f"CRITICAL: Student attendance is {attendance:.1f}%, "
                f"which is below the 40% minimum threshold. "
                f"The student is at serious risk of being barred from "
                f"the final examination. Immediate intervention required."
            ),
        })
    elif attendance < ATTENDANCE_HIGH:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_HIGH,
            "message"          : (
                f"HIGH: Student attendance has dropped to {attendance:.1f}%, "
                f"below the 60% threshold. The student is at high risk of "
                f"academic failure due to insufficient class participation. "
                f"Teacher and counselor follow-up recommended."
            ),
        })
    elif attendance < ATTENDANCE_MEDIUM:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_MEDIUM,
            "message"          : (
                f"MEDIUM: Student attendance is {attendance:.1f}%, "
                f"below the required 75% minimum. "
                f"Student should be reminded of the attendance policy."
            ),
        })

    # ── Quiz performance alert ─────────────────────────────────────────────────
    if quiz_avg < QUIZ_HIGH:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_HIGH,
            "message"          : (
                f"HIGH: Student quiz average is {quiz_avg:.1f}%, "
                f"below the 50% threshold. This indicates significant "
                f"gaps in understanding of core course material. "
                f"Additional academic support is recommended."
            ),
        })

    # ── Assignment performance alert ───────────────────────────────────────────
    if assign_avg < ASSIGNMENT_HIGH:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_HIGH,
            "message"          : (
                f"HIGH: Student assignment average is {assign_avg:.1f}%, "
                f"below the 60% threshold. Consistent underperformance in "
                f"assignments is directly affecting the student's final grade."
            ),
        })

    # ── Midterm performance alert ──────────────────────────────────────────────
    if midterm < MIDTERM_HIGH:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_HIGH,
            "message"          : (
                f"HIGH: Student midterm score is {midterm:.1f}%, "
                f"below the 50% threshold. Midterm performance is the "
                f"strongest predictor of final exam results. "
                f"Urgent academic support is recommended."
            ),
        })

    # ── GPA alert ─────────────────────────────────────────────────────────────
    if gpa < GPA_MEDIUM:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_MEDIUM,
            "message"          : (
                f"MEDIUM: Student historical GPA is {gpa:.2f}, "
                f"below the minimum passing GPA of 2.0. "
                f"Academic counselor review is strongly recommended."
            ),
        })

    # ── ML-based failure probability alerts ───────────────────────────────────
    if fail_prob >= FAILURE_PROB_CRITICAL:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_CRITICAL,
            "message"          : (
                f"CRITICAL: ML model predicts a {fail_prob:.0%} probability "
                f"of failure with a predicted final score of {pred_score:.1f}. "
                f"Risk level: {risk_level}. "
                f"Immediate intervention from teacher, admin, and counselor required."
            ),
        })
    elif fail_prob >= FAILURE_PROB_HIGH:
        alerts.append({
            "notification_type": TYPE_EARLY_WARNING,
            "severity"         : SEV_HIGH,
            "message"          : (
                f"HIGH: ML model predicts a {fail_prob:.0%} probability "
                f"of failure with a predicted final score of {pred_score:.1f}. "
                f"Risk level: {risk_level}. "
                f"Teacher follow-up and additional academic support recommended."
            ),
        })

    return alerts


# ── Deduplication check ────────────────────────────────────────────────────────

def _has_unresolved_alert(
    db         : Session,
    student_id : uuid.UUID,
    severity   : str,
    message    : str,
) -> bool:
    """
    Check if an identical unresolved alert already exists for this student.
    Prevents duplicate notifications from stacking up on repeated predictions.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student
        severity   : alert severity level
        message    : alert message text

    Returns:
        True if identical unresolved alert exists, False otherwise
    """
    existing = (
        db.query(Notification)
        .filter(
            Notification.student_id   == student_id,
            Notification.severity     == severity,
            Notification.message      == message,
            Notification.is_resolved  == False,
        )
        .first()
    )
    return existing is not None


# ── Database save function ─────────────────────────────────────────────────────

def _save_alerts(
    db         : Session,
    student_id : uuid.UUID,
    alerts     : List[Dict[str, str]],
) -> List[Notification]:
    """
    Save alert dicts to the notifications table.
    Skips duplicate unresolved alerts.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student
        alerts     : list of alert dicts from _generate_alerts

    Returns:
        List of newly saved Notification ORM objects
    """
    saved = []

    for alert in alerts:
        # Skip if identical unresolved alert already exists
        if _has_unresolved_alert(
            db         = db,
            student_id = student_id,
            severity   = alert["severity"],
            message    = alert["message"],
        ):
            print(
                f"[SPAS ML] Skipping duplicate alert "
                f"(severity={alert['severity']}) for student {student_id}"
            )
            continue

        record = Notification(
            id                = uuid.uuid4(),
            student_id        = student_id,
            triggered_by      = None,       # NULL = system generated
            notification_type = alert["notification_type"],
            severity          = alert["severity"],
            message           = alert["message"],
            is_resolved       = False,
            created_at        = datetime.now(timezone.utc),
        )
        db.add(record)
        saved.append(record)

    if saved:
        db.commit()

    return saved


# ── Main public functions ──────────────────────────────────────────────────────

def generate_and_save_alerts(
    db         : Session,
    student_id : uuid.UUID,
    raw_input  : Dict[str, Any],
    ml_result  : Dict[str, Any],
) -> List[Notification]:
    """
    Generate early warning alerts and save to database.
    Called automatically by prediction_service after every prediction.

    Only generates alerts when conditions are triggered —
    a LOW risk student with good scores generates no alerts.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student
        raw_input  : raw feature dict from API request
        ml_result  : prediction output from predict_student()

    Returns:
        List of saved Notification ORM objects
    """
    alerts = _generate_alerts(
        raw_input = raw_input,
        ml_result = ml_result,
    )

    if not alerts:
        print(
            f"[SPAS ML] No alerts triggered for student {student_id} "
            f"(risk={ml_result['risk_level']})"
        )
        return []

    saved = _save_alerts(
        db         = db,
        student_id = student_id,
        alerts     = alerts,
    )

    print(
        f"[SPAS ML] {len(saved)} alerts saved for student {student_id} "
        f"(risk={ml_result['risk_level']})"
    )

    return saved


def get_student_notifications(
    db             : Session,
    student_id     : uuid.UUID,
    unresolved_only: bool = False,
) -> List[Notification]:
    """
    Retrieve all notifications for a student.
    Returns most recent first, CRITICAL severity prioritized.

    Args:
        db              : SQLAlchemy database session
        student_id      : UUID of the student
        unresolved_only : if True, return only unresolved alerts

    Returns:
        List of Notification ORM objects
    """
    query = db.query(Notification).filter(
        Notification.student_id == student_id
    )

    if unresolved_only:
        query = query.filter(Notification.is_resolved == False)

    return query.order_by(
        Notification.is_resolved.asc(),    # unresolved first
        Notification.created_at.desc()     # most recent first
    ).all()


def resolve_notification(
    db              : Session,
    notification_id : uuid.UUID,
    student_id      : uuid.UUID,
) -> Notification:
    """
    Mark a notification as resolved.

    Args:
        db              : SQLAlchemy database session
        notification_id : UUID of the notification
        student_id      : UUID of the student (ownership check)

    Returns:
        Updated Notification object

    Raises:
        HTTPException 404 if notification not found
    """
    from fastapi import HTTPException, status

    notification = (
        db.query(Notification)
        .filter(
            Notification.id         == notification_id,
            Notification.student_id == student_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail      = f"Notification '{notification_id}' not found."
        )

    notification.is_resolved = True
    db.commit()
    db.refresh(notification)
    return notification


def get_all_unresolved_notifications(
    db: Session,
) -> List[Notification]:
    """
    Get all unresolved notifications across all students.
    Used by admin dashboard to show institution-wide alerts.

    Args:
        db : SQLAlchemy database session

    Returns:
        List of all unresolved Notification ORM objects
        ordered by severity then most recent
    """
    severity_order = {
        SEV_CRITICAL: 0,
        SEV_HIGH    : 1,
        SEV_MEDIUM  : 2,
        SEV_LOW     : 3,
    }

    notifications = (
        db.query(Notification)
        .filter(Notification.is_resolved == False)
        .order_by(Notification.created_at.desc())
        .all()
    )

    # Sort by severity priority then date
    notifications.sort(
        key=lambda n: (
            severity_order.get(n.severity, 99),
            n.created_at
        )
    )

    return notifications