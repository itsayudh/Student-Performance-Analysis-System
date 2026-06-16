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
    _user          = Depends(require_role("ADMIN", "TEACHER")),
):
    """
    Run ML prediction for a student.

    - Validates all input fields
    - Computes engineered features (ca_avg, rule_risk_score)
    - Runs XGBoost regressor
    - Saves result to predictions table
    - Returns full prediction response
    """
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