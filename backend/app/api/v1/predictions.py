"""
predictions.py
==============
SPAS ML Prediction API Routes

Endpoints:
    POST /predict                        — run prediction for a student
    GET  /predictions/{student_id}       — get all predictions for a student
    GET  /predictions/{student_id}/latest — get most recent prediction
"""

from fastapi        import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.api.deps           import get_db, require_role
from app.schemas.prediction import (
    PredictionInput,
    PredictionResponse,
    PredictionListResponse,
    PredictionRecord,
)
from app.services.prediction_service import (
    run_prediction,
    get_student_predictions,
    get_latest_prediction,
    get_prediction_autofill,
)

router = APIRouter(
    prefix = "/predictions",
    tags   = ["ML Predictions"],
)


# ── POST /predict ─────────────────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model = PredictionResponse,
    status_code    = status.HTTP_200_OK,
    summary        = "Run ML prediction for a student",
    description    = (
        "Accepts raw student feature values, runs the XGBoost regression model, "
        "saves the result to the predictions table, and returns the full prediction "
        "including predicted score, grade, failure probability, and risk level."
    ),
)
def predict(
    data : PredictionInput,
    db   : Session = Depends(get_db),
    current_user   = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    # OWNERSHIP CHECK (same pattern as reports.py's IDOR fix): a student
    # may only ever run a prediction for THEMSELVES. We don't validate
    # their submitted student_id — we ignore it outright and substitute
    # their own, so there's no way to target another student even by
    # tampering with the request body.
    if current_user.role == "STUDENT":
        if not current_user.student:
            raise HTTPException(status_code=403, detail="No student profile linked to this account")
        data.student_id = str(current_user.student.id)

    return run_prediction(db=db, data=data)


# ── GET /predictions/{student_id} ─────────────────────────────────────────────

@router.get(
    "/{student_id}",
    response_model = PredictionListResponse,
    status_code    = status.HTTP_200_OK,
    summary        = "Get all predictions for a student",
    description    = "Returns all stored predictions for a student, most recent first.",
)
def get_predictions(
    student_id : uuid.UUID,
    db         : Session = Depends(get_db),
    _user                = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    return get_student_predictions(db=db, student_id=student_id)


# ── GET /predictions/{student_id}/latest ──────────────────────────────────────

@router.get(
    "/{student_id}/latest",
    response_model = PredictionRecord,
    status_code    = status.HTTP_200_OK,
    summary        = "Get most recent prediction for a student",
    description    = "Returns only the latest prediction record for a student.",
)
def get_latest(
    student_id : uuid.UUID,
    db         : Session = Depends(get_db),
    _user                = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    prediction = get_latest_prediction(db=db, student_id=student_id)
    if not prediction:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail      = f"No predictions found for student '{student_id}'."
        )
    return prediction

# ── GET /predictions/{student_id}/autofill ────────────────────────────────────

@router.get(
    "/{student_id}/autofill",
    status_code = status.HTTP_200_OK,
    summary     = "Auto-computed prediction input values from real records",
    description = (
        "Computes attendance_percentage, quiz_score_avg, assignment_score_avg, "
        "midterm_score, and historical_gpa from the student's actual attendance, "
        "marks, and GPA records. study_hours_per_week and subject_difficulty_score "
        "are NOT included — no database source exists for either; the frontend "
        "form leaves those two fields for manual entry."
    ),
)
def autofill(
    student_id : str,
    subject_id : str = None,
    db         : Session = Depends(get_db),
    current_user        = Depends(require_role("ADMIN", "TEACHER", "STUDENT")),
):
    # Same ownership rule as predict(): a student can only autofill
    # their OWN data.
    if current_user.role == "STUDENT":
        if not current_user.student:
            raise HTTPException(status_code=403, detail="No student profile linked to this account")
        student_id = str(current_user.student.id)

    return get_prediction_autofill(db=db, student_id=student_id, subject_id=subject_id)