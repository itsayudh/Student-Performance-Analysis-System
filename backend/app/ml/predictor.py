"""
predictor.py
============
SPAS Machine Learning Inference Module

This module is loaded once at FastAPI startup via initialize_models().
All prediction requests are handled by predict_student().

Usage in FastAPI:
    from app.ml.predictor import initialize_models, predict_student

    @app.on_event("startup")
    def startup():
        initialize_models()

    @router.post("/predict")
    def predict(data: PredictionInput):
        features = data.dict()
        return predict_student(features)
"""

import numpy as np ## initilizing the numpy
import joblib
import os

# ── Model registry — loaded once at startup ────────────────────────────────
_models = {}


def initialize_models(models_dir: str = None):
    """
    Load all PKL files into memory.
    Called once at FastAPI application startup.

    Args:
        models_dir: path to models folder.
                    Defaults to the models/ folder
                    relative to this file.
    """
    if models_dir is None:
        models_dir = os.path.join(os.path.dirname(__file__), "models")

    _models["regressor"]     = joblib.load(
        os.path.join(models_dir, "grade_predictor.pkl")
    )
    _models["scaler"]        = joblib.load(
        os.path.join(models_dir, "feature_scaler.pkl")
    )
    _models["feature_list"]  = joblib.load(
        os.path.join(models_dir, "feature_list.pkl")
    )
    print(f"[SPAS ML] Models loaded successfully from {models_dir}")
    print(f"[SPAS ML] Features : {_models['feature_list']}")


# ── Derivation helpers ─────────────────────────────────────────────────────

def derive_grade(score: float) -> str:
    """
    Map predicted score to letter grade.
    Custom grading scale — SPAS system.
    """
    if score >= 90:   return "A+"
    elif score >= 80: return "A"
    elif score >= 70: return "B+"
    elif score >= 60: return "B"
    elif score >= 50: return "C+"
    elif score >= 40: return "C"
    elif score >= 30: return "D+"
    elif score >= 20: return "D"
    else:             return "E"


def derive_failure_probability(score: float) -> float:
    """
    Soft failure probability derived from distance to
    the 60-point pass/fail boundary.

    Score = 60  -> prob = 0.50  (right on the boundary)
    Score = 40  -> prob = 1.00  (very likely to fail)
    Score = 80  -> prob = 0.00  (very unlikely to fail)
    """
    prob = (60.0 - score) / 20.0 + 0.5
    return round(float(np.clip(prob, 0.0, 1.0)), 4)


def derive_risk_level(failure_prob: float) -> str:
    """
    Map failure probability to risk level.
    Thresholds from Section 8.10 of SPAS documentation.
    """
    if failure_prob >= 0.75:   return "CRITICAL"
    elif failure_prob >= 0.55: return "HIGH"
    elif failure_prob >= 0.35: return "MEDIUM"
    else:                      return "LOW"


# ── Main inference function ────────────────────────────────────────────────

def predict_student(features: dict) -> dict:
    """
    Run full ML inference for a single student.

    Args:
        features (dict): must contain all keys in feature_list.pkl.
            Required keys:
                - attendance_percentage    (float, 0-100)
                - midterm_score            (float, 0-100)
                - historical_gpa           (float, 0.0-4.0)
                - study_hours_per_week     (float)
                - subject_difficulty_score (float, 0-1)
                - ca_avg                   (float, 0-100)
                - rule_risk_score          (float, 0-1)

    Returns:
        dict:
            - predicted_score     (float)  : predicted final exam score
            - predicted_grade     (str)    : letter grade A+/A/B+/B/C+/C/D+/D/E
            - failure_probability (float)  : probability of failing (0.0-1.0)
            - risk_level          (str)    : LOW / MEDIUM / HIGH / CRITICAL
            - pass_fail           (int)    : 1 = Pass, 0 = Fail

    Raises:
        RuntimeError: if initialize_models() has not been called yet
    """
    if not _models:
        raise RuntimeError(
            "Models not loaded. Call initialize_models() at application startup."
        )

    feature_list = _models["feature_list"]
    scaler       = _models["scaler"]
    regressor    = _models["regressor"]

    # Build feature vector in the exact order the scaler expects
    X_input  = np.array([[features.get(f, 0.0) for f in feature_list]])

    # Scale features
    X_scaled = scaler.transform(X_input)

    # Predict final score
    predicted_score = float(
        np.clip(regressor.predict(X_scaled)[0], 0.0, 100.0)
    )

    # Derive all outputs from predicted score
    failure_prob    = derive_failure_probability(predicted_score)
    predicted_grade = derive_grade(predicted_score)
    risk_level      = derive_risk_level(failure_prob)
    pass_fail       = 1 if predicted_score >= 60.0 else 0

    return {
        "predicted_score"    : round(predicted_score, 2),
        "predicted_grade"    : predicted_grade,
        "failure_probability": failure_prob,
        "risk_level"         : risk_level,
        "pass_fail"          : pass_fail,
    }


