"""
feature_engineering.py
======================
SPAS ML Feature Engineering Module

This module receives raw input from the FastAPI prediction endpoint
and computes the two engineered features required by the ML model
before passing to predict_student() in predictor.py

Raw input fields (sent from frontend):
    - attendance_percentage
    - midterm_score
    - historical_gpa
    - study_hours_per_week
    - subject_difficulty_score
    - quiz_score_avg
    - assignment_score_avg

Engineered features computed here:
    - ca_avg          : (quiz_score_avg * 0.5) + (assignment_score_avg * 0.5)
    - rule_risk_score : composite risk from attendance + ca + midterm

Final output (7 features passed to predict_student()):
    - attendance_percentage
    - midterm_score
    - historical_gpa
    - study_hours_per_week
    - subject_difficulty_score
    - ca_avg            (engineered)
    - rule_risk_score   (engineered)
"""


# ── Validation constants ───────────────────────────────────────────────────────
SCORE_MIN = 0.0
SCORE_MAX = 100.0
GPA_MIN   = 0.0
GPA_MAX   = 4.0
HOURS_MIN = 0.0
HOURS_MAX = 168.0
DIFF_MIN  = 0.0
DIFF_MAX  = 1.0


# ── Validation helper ──────────────────────────────────────────────────────────

def _validate_raw_input(raw: dict) -> None:
    """
    Validate all required fields are present and within valid ranges.

    Args:
        raw (dict): raw input from the API request

    Raises:
        ValueError: if any required field is missing or out of range
    """
    required_fields = [
        "attendance_percentage",
        "midterm_score",
        "historical_gpa",
        "study_hours_per_week",
        "subject_difficulty_score",
        "quiz_score_avg",
        "assignment_score_avg",
    ]

    # Check all required fields are present
    missing = [f for f in required_fields if f not in raw]
    if missing:
        raise ValueError(
            f"Missing required fields: {missing}"
        )

    # Check score fields are within 0-100
    score_fields = [
        "attendance_percentage",
        "midterm_score",
        "quiz_score_avg",
        "assignment_score_avg",
    ]
    for field in score_fields:
        val = raw[field]
        if not (SCORE_MIN <= val <= SCORE_MAX):
            raise ValueError(
                f"'{field}' must be between {SCORE_MIN} and "
                f"{SCORE_MAX}. Got: {val}"
            )

    # Check GPA range
    if not (GPA_MIN <= raw["historical_gpa"] <= GPA_MAX):
        raise ValueError(
            f"'historical_gpa' must be between {GPA_MIN} and "
            f"{GPA_MAX}. Got: {raw['historical_gpa']}"
        )

    # Check study hours range
    if not (HOURS_MIN <= raw["study_hours_per_week"] <= HOURS_MAX):
        raise ValueError(
            f"'study_hours_per_week' must be between {HOURS_MIN} and "
            f"{HOURS_MAX}. Got: {raw['study_hours_per_week']}"
        )

    # Check difficulty score range
    if not (DIFF_MIN <= raw["subject_difficulty_score"] <= DIFF_MAX):
        raise ValueError(
            f"'subject_difficulty_score' must be between {DIFF_MIN} and "
            f"{DIFF_MAX}. Got: {raw['subject_difficulty_score']}"
        )


# ── Engineered feature functions ───────────────────────────────────────────────

def compute_ca_avg(
    quiz_score_avg      : float,
    assignment_score_avg: float,
) -> float:
    """
    Continuous Assessment Average.
    Equal-weighted combination of quiz and assignment scores.

    Formula: (quiz_score_avg * 0.5) + (assignment_score_avg * 0.5)

    Args:
        quiz_score_avg       (float): average quiz score 0-100
        assignment_score_avg (float): average assignment score 0-100

    Returns:
        float: ca_avg rounded to 4 decimal places
    """
    ca_avg = (quiz_score_avg * 0.5) + (assignment_score_avg * 0.5)
    return round(float(ca_avg), 4)


def compute_rule_risk_score(
    attendance_percentage: float,
    ca_avg               : float,
    midterm_score        : float,
) -> float:
    """
    Rule-based composite risk score.
    Higher value means higher risk of failing.

    Formula from Section 8.5 of SPAS documentation:
        ((100 - attendance_pct) * 0.4
       + (100 - ca_avg)         * 0.3
       + (100 - midterm_score)  * 0.3) / 100

    Args:
        attendance_percentage (float): attendance % 0-100
        ca_avg                (float): continuous assessment avg 0-100
        midterm_score         (float): midterm exam score 0-100

    Returns:
        float: risk score between 0.0 and 1.0
    """
    risk = (
        (100 - attendance_percentage) * 0.4
        + (100 - ca_avg)              * 0.3
        + (100 - midterm_score)       * 0.3
    ) / 100

    risk = max(0.0, min(1.0, risk))
    return round(float(risk), 4)


# ── Main preprocessing function ───────────────────────────────────────────────

def preprocess_input(raw: dict) -> dict:
    """
    Transform raw API input into the 7-feature dict
    expected by predict_student() in predictor.py

    This is the main function called by prediction_service.py

    Args:
        raw (dict): raw input from the API with these keys:
            - attendance_percentage
            - midterm_score
            - historical_gpa
            - study_hours_per_week
            - subject_difficulty_score
            - quiz_score_avg
            - assignment_score_avg

    Returns:
        dict: 7-feature dict ready for predict_student():
            - attendance_percentage
            - midterm_score
            - historical_gpa
            - study_hours_per_week
            - subject_difficulty_score
            - ca_avg            (engineered)
            - rule_risk_score   (engineered)

    Raises:
        ValueError: if input validation fails
    """

    # Step 1 — Validate all fields
    _validate_raw_input(raw)

    # Step 2 — Compute engineered features
    ca_avg = compute_ca_avg(
        quiz_score_avg       = raw["quiz_score_avg"],
        assignment_score_avg = raw["assignment_score_avg"],
    )

    rule_risk_score = compute_rule_risk_score(
        attendance_percentage = raw["attendance_percentage"],
        ca_avg                = ca_avg,
        midterm_score         = raw["midterm_score"],
    )

    # Step 3 — Build final 7-feature dict
    # Note: quiz_score_avg and assignment_score_avg are NOT passed
    # to the model — they were dropped during feature selection
    # due to multicollinearity with ca_avg
    features = {
        "attendance_percentage"   : raw["attendance_percentage"],
        "midterm_score"           : raw["midterm_score"],
        "historical_gpa"          : raw["historical_gpa"],
        "study_hours_per_week"    : raw["study_hours_per_week"],
        "subject_difficulty_score": raw["subject_difficulty_score"],
        "ca_avg"                  : ca_avg,
        "rule_risk_score"         : rule_risk_score,
    }

    return features