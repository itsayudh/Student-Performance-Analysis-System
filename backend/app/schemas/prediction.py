"""
schemas/prediction.py
=====================
Pydantic request and response schemas for the
SPAS ML prediction endpoints.

PredictionInput  → what the frontend sends to POST /predict
PredictionResponse → what the API returns after running the model
PredictionRecord   → what is returned from GET /predictions/{student_id}
"""

from pydantic   import BaseModel, Field, validator
from typing     import Optional, List
from datetime   import datetime
import uuid


# ── Request Schema ─────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    """
    Raw input sent from the frontend when requesting a prediction.
    All feature values are validated here before reaching the ML model.
    """

    # ── Identifiers ────────────────────────────────────────────────────────────
    student_id : uuid.UUID        = Field(..., description="UUID of the student")
    subject_id : Optional[uuid.UUID] = Field(None, description="UUID of the subject (optional)")

    # ── Raw feature fields (7 fields from frontend) ────────────────────────────
    attendance_percentage    : float = Field(..., ge=0.0,  le=100.0,
                                             description="Attendance percentage 0-100")
    midterm_score            : float = Field(..., ge=0.0,  le=100.0,
                                             description="Midterm exam score 0-100")
    historical_gpa           : float = Field(..., ge=0.0,  le=4.0,
                                             description="Previous semester GPA 0.0-4.0")
    study_hours_per_week     : float = Field(..., ge=0.0,  le=168.0,
                                             description="Study hours per week")
    subject_difficulty_score : float = Field(..., ge=0.0,  le=1.0,
                                             description="Subject difficulty score 0.0-1.0")
    quiz_score_avg           : float = Field(..., ge=0.0,  le=100.0,
                                             description="Average quiz score 0-100")
    assignment_score_avg     : float = Field(..., ge=0.0,  le=100.0,
                                             description="Average assignment score 0-100")

    class Config:
        json_schema_extra = {
            "example": {
                "student_id"              : "550e8400-e29b-41d4-a716-446655440000",
                "subject_id"              : "550e8400-e29b-41d4-a716-446655440001",
                "attendance_percentage"   : 82.5,
                "midterm_score"           : 74.0,
                "historical_gpa"          : 3.2,
                "study_hours_per_week"    : 18.0,
                "subject_difficulty_score": 0.65,
                "quiz_score_avg"          : 72.0,
                "assignment_score_avg"    : 70.0,
            }
        }


# ── Response Schemas ───────────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    """
    Full prediction result returned after running the ML model.
    Returned by POST /predict
    """
    prediction_id       : uuid.UUID
    student_id          : uuid.UUID
    subject_id          : Optional[uuid.UUID]

    # ── ML outputs ─────────────────────────────────────────────────────────────
    predicted_score     : float   = Field(..., description="Predicted final exam score 0-100")
    predicted_grade     : str     = Field(..., description="Predicted letter grade A+/A/B+/B/C+/C/D+/D/E")
    failure_probability : float   = Field(..., description="Probability of failing 0.0-1.0")
    risk_level          : str     = Field(..., description="LOW / MEDIUM / HIGH / CRITICAL")
    pass_fail           : str     = Field(..., description="PASS or FAIL")

    # ── Engineered features used (for transparency) ────────────────────────────
    ca_avg              : float   = Field(..., description="Continuous assessment average")
    rule_risk_score     : float   = Field(..., description="Rule-based risk score")

    # ── Metadata ───────────────────────────────────────────────────────────────
    predicted_at        : datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "prediction_id"      : "660e8400-e29b-41d4-a716-446655440000",
                "student_id"         : "550e8400-e29b-41d4-a716-446655440000",
                "subject_id"         : "550e8400-e29b-41d4-a716-446655440001",
                "predicted_score"    : 73.45,
                "predicted_grade"    : "B+",
                "failure_probability": 0.1300,
                "risk_level"         : "LOW",
                "pass_fail"          : "PASS",
                "ca_avg"             : 71.0,
                "rule_risk_score"    : 0.197,
                "predicted_at"       : "2025-01-15T10:30:00Z",
            }
        }


class PredictionRecord(BaseModel):
    """
    Single prediction record returned from GET /predictions/{student_id}
    """
    prediction_id       : uuid.UUID
    subject_id          : Optional[uuid.UUID]
    predicted_score     : float
    predicted_grade     : str
    failure_probability : float
    risk_level          : str
    pass_fail           : str
    predicted_at        : datetime

    class Config:
        from_attributes = True


class PredictionListResponse(BaseModel):
    """
    List of all predictions for a student.
    Returned by GET /predictions/{student_id}
    """
    student_id  : uuid.UUID
    total       : int
    predictions : List[PredictionRecord]