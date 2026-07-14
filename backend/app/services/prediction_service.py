"""
prediction_service.py
=====================
SPAS ML Prediction Service

Handles the full prediction pipeline:
1. Receive raw input from API route
2. Call feature_engineering.preprocess_input() to compute engineered features
3. Call predictor.predict_student() to run the ML model
4. Save prediction result to the predictions table
5. Return structured prediction response
"""

import uuid
import json
from datetime       import datetime, timezone
from sqlalchemy.orm import Session

from app.ml.predictor           import predict_student
from app.ml.feature_engineering import preprocess_input
from app.models.prediction      import Prediction
from app.models.student         import Student
from app.schemas.prediction     import (
    PredictionInput,
    PredictionResponse,
    PredictionRecord,
    PredictionListResponse,
)
from app.services.attendance_service import get_student_attendance
from app.services.marks_service import get_student_marks
from app.models.marks import GPARecord


# ── Helper ─────────────────────────────────────────────────────────────────────

def _get_student_or_404(db: Session, student_id: uuid.UUID) -> Student:
    """
    Fetch student from database or raise 404.
    """
    from fastapi import HTTPException, status
    student = db.query(Student).filter(
        Student.id        == student_id,
        Student.is_active == True
    ).first()

    if not student:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail      = f"Student with id '{student_id}' not found."
        )
    return student


# ── Main service functions ─────────────────────────────────────────────────────

def run_prediction(
    db    : Session,
    data  : PredictionInput,
) -> PredictionResponse:
    """
    Run full ML prediction pipeline for a single student.

    Steps:
        1. Validate student exists in database
        2. Build raw feature dict from input
        3. Run feature engineering (compute ca_avg, rule_risk_score)
        4. Run ML model (predict_student)
        5. Save prediction to database
        6. Return PredictionResponse

    Args:
        db   : SQLAlchemy database session
        data : PredictionInput schema from API request

    Returns:
        PredictionResponse with all ML outputs
    """

    # Step 1 — Verify student exists
    _get_student_or_404(db, data.student_id)

    # Step 2 — Build raw feature dict from API input
    raw_features = {
        "attendance_percentage"   : data.attendance_percentage,
        "midterm_score"           : data.midterm_score,
        "historical_gpa"          : data.historical_gpa,
        "study_hours_per_week"    : data.study_hours_per_week,
        "subject_difficulty_score": data.subject_difficulty_score,
        "quiz_score_avg"          : data.quiz_score_avg,
        "assignment_score_avg"    : data.assignment_score_avg,
    }

    # Step 3 — Feature engineering
    # Computes ca_avg and rule_risk_score
    # Returns the 7-feature dict the model expects
    engineered_features = preprocess_input(raw_features)

    # Step 4 — Run ML model
    ml_result = predict_student(engineered_features)

    # Step 5 — Save prediction to database
    prediction_record = Prediction(
        id                  = uuid.uuid4(),
        student_id          = data.student_id,
        subject_id          = data.subject_id,
        predicted_grade     = ml_result["predicted_grade"],
        predicted_score     = ml_result["predicted_score"],
        failure_probability = ml_result["failure_probability"],
        risk_level          = ml_result["risk_level"],
        pass_fail           = "PASS" if ml_result["pass_fail"] == 1 else "FAIL",
        feature_snapshot    = engineered_features,   # saved as JSONB for audit
        predicted_at        = datetime.now(timezone.utc),
    )

    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    #Generate and save recommendations automatically
    from app.services.recommendation_service import generate_and_save_recommendations
    generate_and_save_recommendations(
        db         = db,
        student_id = data.student_id,
        raw_input  = raw_features,
        ml_result  = ml_result,
    )

    #Generate and save early warning alerts
    from app.services.notification_service import generate_and_save_alerts
    generate_and_save_alerts(
        db         = db,
        student_id = data.student_id,
        raw_input  = raw_features,
        ml_result  = ml_result,
    )

    # Step 6 — Return response
    return PredictionResponse(
        prediction_id       = prediction_record.id,
        student_id          = prediction_record.student_id,
        subject_id          = prediction_record.subject_id,
        predicted_score     = prediction_record.predicted_score,
        predicted_grade     = prediction_record.predicted_grade,
        failure_probability = prediction_record.failure_probability,
        risk_level          = prediction_record.risk_level,
        pass_fail           = prediction_record.pass_fail,
        ca_avg              = engineered_features["ca_avg"],
        rule_risk_score     = engineered_features["rule_risk_score"],
        predicted_at        = prediction_record.predicted_at,
    )


def get_student_predictions(
    db         : Session,
    student_id : uuid.UUID,
) -> PredictionListResponse:
    """
    Retrieve all stored predictions for a student.
    Returns most recent prediction first.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student

    Returns:
        PredictionListResponse with list of all predictions
    """

    # Verify student exists
    _get_student_or_404(db, student_id)

    # Query all predictions for this student
    predictions = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.predicted_at.desc())
        .all()
    )

    return PredictionListResponse(
        student_id  = student_id,
        total       = len(predictions),
        predictions = [
            PredictionRecord(
                prediction_id       = p.id,
                subject_id          = p.subject_id,
                predicted_score     = p.predicted_score,
                predicted_grade     = p.predicted_grade,
                failure_probability = p.failure_probability,
                risk_level          = p.risk_level,
                pass_fail           = p.pass_fail,
                predicted_at        = p.predicted_at,
            )
            for p in predictions
        ],
    )


def get_latest_prediction(
    db         : Session,
    student_id : uuid.UUID,
) -> PredictionRecord | None:
    """
    Get the most recent prediction for a student.
    Used by recommendation_service and notification_service.

    Args:
        db         : SQLAlchemy database session
        student_id : UUID of the student

    Returns:
        Most recent PredictionRecord or None if no predictions exist
    """
    prediction = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.predicted_at.desc())
        .first()
    )

    if not prediction:
        return None

    return PredictionRecord(
        prediction_id       = prediction.id,
        subject_id          = prediction.subject_id,
        predicted_score     = prediction.predicted_score,
        predicted_grade     = prediction.predicted_grade,
        failure_probability = prediction.failure_probability,
        risk_level          = prediction.risk_level,
        pass_fail           = prediction.pass_fail,
        predicted_at        = prediction.predicted_at,
    )

from app.services.attendance_service import get_student_attendance
from app.services.marks_service import get_student_marks


def get_prediction_autofill(db: Session, student_id: str, subject_id: str = None):
    """
    Computes 5 of PredictionInput's 7 fields from real records, reusing
    the exact same service functions the Attendance/Marks pages already
    call — no parallel query logic to drift out of sync later.

    study_hours_per_week and subject_difficulty_score are DELIBERATELY
    omitted: no table stores either value (confirmed during
    reconnaissance — Student and Subject models have no such columns).
    They stay manual-entry fields on the frontend form.
    """
    attendance = get_student_attendance(db, student_id, subject_id=subject_id)
    attendance_percentage = attendance["summary"]["overall_percentage"]

    marks = get_student_marks(db, student_id, subject_id=subject_id)

    # Aggregate quiz/assignment averages and the latest midterm ACROSS
    # every subject in the response (or the single subject, if
    # subject_id was passed — get_student_marks already filtered).
    quiz_scores, assignment_scores, midterm_scores = [], [], []
    for subj in marks["marks"]:
        for q in subj.get("quiz") or []:
            if q["max_score"] > 0:
                quiz_scores.append(q["score"] / q["max_score"] * 100)
        for a in subj.get("assignment") or []:
            if a["max_score"] > 0:
                assignment_scores.append(a["score"] / a["max_score"] * 100)
        mid = subj.get("midterm")
        if mid and mid["max_score"] > 0:
            midterm_scores.append(mid["score"] / mid["max_score"] * 100)

    def avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else None

    gpa_record = db.query(GPARecord).filter(
        GPARecord.student_id == student_id
    ).order_by(GPARecord.calculated_at.desc()).first()

    return {
        "attendance_percentage": round(attendance_percentage, 2) if attendance_percentage is not None else None,
        "quiz_score_avg":        avg(quiz_scores),
        "assignment_score_avg":  avg(assignment_scores),
        "midterm_score":         avg(midterm_scores),
        "historical_gpa":        gpa_record.cgpa if gpa_record else None,
        # Explicitly signaling absence rather than omitting the keys —
        # the frontend checks these to show "no data source" helper text.
        "study_hours_per_week":     None,
        "subject_difficulty_score": None,
    }