"""
recommendation_service.py
=========================
SPAS ML Recommendation Service

Generates personalized academic recommendations for students
based on their raw feature values and ML prediction results.

Two types of recommendations:
1. Rule-based  — deterministic, triggered by threshold conditions
2. ML-based    — driven by predicted score and risk level

Called automatically after every prediction in prediction_service.py
"""

import uuid
from datetime       import datetime, timezone
from typing         import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.recommendation import Recommendation


# ── Recommendation type constants ──────────────────────────────────────────────
TYPE_ATTENDANCE = "ATTENDANCE"
TYPE_MARKS      = "MARKS"
TYPE_GPA        = "GPA"
TYPE_STUDY      = "STUDY"
TYPE_GENERAL    = "GENERAL"

# ── Priority constants ─────────────────────────────────────────────────────────
PRIORITY_HIGH   = "HIGH"
PRIORITY_MEDIUM = "MEDIUM"
PRIORITY_LOW    = "LOW"

# ── Thresholds from Section 3.8.1 of SPAS documentation ──────────────────────
ATTENDANCE_CRITICAL   = 60.0
ATTENDANCE_WARNING    = 75.0
QUIZ_LOW              = 50.0
QUIZ_WARNING          = 65.0
ASSIGNMENT_LOW        = 60.0
ASSIGNMENT_WARNING    = 70.0
GPA_FAILING           = 2.0
GPA_WARNING           = 2.5
MIDTERM_LOW           = 50.0
MIDTERM_WARNING       = 60.0
FAILURE_PROB_HIGH     = 0.55
FAILURE_PROB_CRITICAL = 0.75


# ── Rule-based recommendation engine ──────────────────────────────────────────

def _generate_rule_based_recommendations(
    raw_input : Dict[str, Any],
    ml_result : Dict[str, Any],
) -> List[Dict[str, str]]:
    """
    Generate deterministic recommendations based on threshold conditions.
    Each condition independently checked — a student can receive
    multiple recommendations covering different weak areas.

    Args:
        raw_input : dict of raw feature values from API request
        ml_result : dict of ML prediction outputs from predict_student()

    Returns:
        List of dicts with keys: type, priority, message
    """
    recommendations = []

    attendance   = raw_input["attendance_percentage"]
    quiz_avg     = raw_input["quiz_score_avg"]
    assign_avg   = raw_input["assignment_score_avg"]
    midterm      = raw_input["midterm_score"]
    gpa          = raw_input["historical_gpa"]
    fail_prob    = ml_result["failure_probability"]
    risk_level   = ml_result["risk_level"]
    pred_score   = ml_result["predicted_score"]

    # ── Attendance checks ──────────────────────────────────────────────────────
    if attendance < ATTENDANCE_CRITICAL:
        recommendations.append({
            "type"    : TYPE_ATTENDANCE,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your attendance is critically low at {attendance:.1f}%. "
                f"Missing more than 40% of classes significantly impacts your "
                f"final performance. Attend all remaining sessions without exception. "
                f"Contact your teacher immediately to discuss your situation."
            ),
        })
    elif attendance < ATTENDANCE_WARNING:
        recommendations.append({
            "type"    : TYPE_ATTENDANCE,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your attendance is {attendance:.1f}%, which is below the required "
                f"75% minimum. You are at risk of being barred from the final exam. "
                f"Make attending every remaining class your top priority."
            ),
        })

    # ── Quiz performance checks ────────────────────────────────────────────────
    if quiz_avg < QUIZ_LOW:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your quiz average is {quiz_avg:.1f}%, which indicates significant "
                f"gaps in your understanding of the course material. "
                f"Review all lecture notes from the beginning, attempt past quiz "
                f"papers, and seek clarification from your teacher on topics you "
                f"find difficult before the next quiz."
            ),
        })
    elif quiz_avg < QUIZ_WARNING:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your quiz average is {quiz_avg:.1f}%. While passing, there is "
                f"room for improvement. Review your weakest quiz topics and "
                f"practice additional exercises to strengthen your understanding."
            ),
        })

    # ── Assignment performance checks ──────────────────────────────────────────
    if assign_avg < ASSIGNMENT_LOW:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your assignment average is {assign_avg:.1f}%, which is below "
                f"the passing threshold. Consistently poor or late assignments "
                f"directly affect your final grade. Allocate at least 3 additional "
                f"study hours per week specifically to assignment completion and "
                f"review all returned feedback carefully."
            ),
        })
    elif assign_avg < ASSIGNMENT_WARNING:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your assignment average is {assign_avg:.1f}%. Focus on improving "
                f"the quality of your submissions. Re-read assignment requirements "
                f"carefully before submitting and allocate adequate time for review."
            ),
        })

    # ── Midterm performance checks ─────────────────────────────────────────────
    if midterm < MIDTERM_LOW:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your midterm score is {midterm:.1f}%, which is significantly "
                f"below the passing threshold. The midterm is the strongest "
                f"predictor of your final exam result. Consider forming a study "
                f"group, seeking tutoring, or visiting your teacher during office "
                f"hours to address the gaps identified in your midterm performance."
            ),
        })
    elif midterm < MIDTERM_WARNING:
        recommendations.append({
            "type"    : TYPE_MARKS,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your midterm score is {midterm:.1f}%. Review the topics where "
                f"you lost marks and create a focused study plan targeting those "
                f"areas before the final exam."
            ),
        })

    # ── GPA checks ────────────────────────────────────────────────────────────
    if gpa < GPA_FAILING:
        recommendations.append({
            "type"    : TYPE_GPA,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your historical GPA is {gpa:.2f}, which is below the minimum "
                f"passing GPA of 2.0. Visit your academic counselor this week "
                f"to create a structured academic recovery plan. Early intervention "
                f"is critical to reversing this trend."
            ),
        })
    elif gpa < GPA_WARNING:
        recommendations.append({
            "type"    : TYPE_GPA,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your GPA of {gpa:.2f} is below the recommended 2.5 threshold. "
                f"Focus on improving your weakest subjects first and consider "
                f"speaking with your academic advisor about available support programs."
            ),
        })

    # ── ML-based risk recommendations ─────────────────────────────────────────
    if risk_level == "CRITICAL":
        recommendations.append({
            "type"    : TYPE_GENERAL,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Based on your current performance data, our prediction model "
                f"estimates a {fail_prob:.0%} probability of failing this subject "
                f"with a predicted final score of {pred_score:.1f}. "
                f"Immediate and sustained action is required across all areas — "
                f"attendance, assignments, quiz preparation, and exam revision. "
                f"Contact your teacher and academic counselor today."
            ),
        })
    elif risk_level == "HIGH":
        recommendations.append({
            "type"    : TYPE_GENERAL,
            "priority": PRIORITY_HIGH,
            "message" : (
                f"Your predicted final score is {pred_score:.1f} with a "
                f"{fail_prob:.0%} failure probability. You are at high risk. "
                f"Significantly increase your study hours and focus on the "
                f"areas flagged above. Consistent effort over the coming weeks "
                f"can still meaningfully improve your outcome."
            ),
        })
    elif risk_level == "MEDIUM":
        recommendations.append({
            "type"    : TYPE_GENERAL,
            "priority": PRIORITY_MEDIUM,
            "message" : (
                f"Your predicted final score is {pred_score:.1f}. You are on "
                f"the borderline. Small improvements in your weaker areas — "
                f"particularly attendance and quiz performance — can push your "
                f"final grade into a safer range. Stay consistent."
            ),
        })
    else:
        # LOW risk — positive reinforcement
        recommendations.append({
            "type"    : TYPE_GENERAL,
            "priority": PRIORITY_LOW,
            "message" : (
                f"Your predicted final score is {pred_score:.1f} and your "
                f"overall performance is on track. Keep maintaining your current "
                f"study habits and attendance. Aim to strengthen any subject "
                f"areas where your quiz or assignment scores are below 80%."
            ),
        })

    return recommendations


# ── Database save function ─────────────────────────────────────────────────────

def _save_recommendations(
    db             : Session,
    student_id     : uuid.UUID,
    recommendations: List[Dict[str, str]],
) -> List[Recommendation]:
    """
    Save list of recommendation dicts to the recommendations table.

    Args:
        db              : SQLAlchemy database session
        student_id      : UUID of the student
        recommendations : list of dicts from _generate_rule_based_recommendations

    Returns:
        List of saved Recommendation ORM objects
    """
    saved = []
    for rec in recommendations:
        record = Recommendation(
            id                  = uuid.uuid4(),
            student_id          = student_id,
            recommendation_type = rec["type"],
            message             = rec["message"],
            priority            = rec["priority"],
            is_read             = False,
            created_at          = datetime.now(timezone.utc),
        )
        db.add(record)
        saved.append(record)

    db.commit()
    return saved


# ── Main public function ───────────────────────────────────────────────────────

def generate_and_save_recommendations(
    db         : Session,
    student_id : uuid.UUID,
    raw_input  : Dict[str, Any],
    ml_result  : Dict[str, Any],
) -> List[Recommendation]:
    """
    Generate recommendations and save them to the database.
    Called automatically by prediction_service after every prediction.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student
        raw_input  : raw feature dict from API request
        ml_result  : prediction output from predict_student()

    Returns:
        List of saved Recommendation ORM objects
    """
    # Generate recommendations
    recommendations = _generate_rule_based_recommendations(
        raw_input = raw_input,
        ml_result = ml_result,
    )

    # Save to database
    saved = _save_recommendations(
        db              = db,
        student_id      = student_id,
        recommendations = recommendations,
    )

    print(
        f"[SPAS ML] {len(saved)} recommendations generated "
        f"for student {student_id}"
    )

    return saved


def get_student_recommendations(
    db         : Session,
    student_id : uuid.UUID,
) -> List[Recommendation]:
    """
    Retrieve all recommendations for a student from the database.
    Returns most recent first, unread recommendations prioritized.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student

    Returns:
        List of Recommendation ORM objects
    """
    return (
        db.query(Recommendation)
        .filter(Recommendation.student_id == student_id)
        .order_by(
            Recommendation.is_read.asc(),        # unread first
            Recommendation.created_at.desc()     # most recent first
        )
        .all()
    )


def mark_recommendation_as_read(
    db                : Session,
    recommendation_id : uuid.UUID,
    student_id        : uuid.UUID,
) -> Recommendation:
    """
    Mark a single recommendation as read.

    Args:
        db                : SQLAlchemy database session
        recommendation_id : UUID of the recommendation
        student_id        : UUID of the student (for ownership check)

    Returns:
        Updated Recommendation object

    Raises:
        HTTPException 404 if recommendation not found
    """
    from fastapi import HTTPException, status

    rec = (
        db.query(Recommendation)
        .filter(
            Recommendation.id         == recommendation_id,
            Recommendation.student_id == student_id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail      = f"Recommendation '{recommendation_id}' not found."
        )

    rec.is_read = True
    db.commit()
    db.refresh(rec)
    return rec