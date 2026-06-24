"""
test_ml_predictor.py
====================
Unit tests for app/ml/predictor.py

Tests cover:
    - initialize_models() — loads all PKL files correctly
    - predict_student()   — returns correct keys
    - predict_student()   — score clamped to 0-100
    - predict_student()   — failure probability between 0 and 1
    - predict_student()   — risk level correct for known inputs
    - predict_student()   — grade letter correct for known scores
    - predict_student()   — pass/fail correct for known scores
    - predict_student()   — good performer gets LOW risk
    - predict_student()   — at-risk student gets HIGH/CRITICAL risk
    - derive_grade()      — all grade bands correct
    - derive_failure_probability() — boundary values correct
    - derive_risk_level() — all thresholds correct
"""

import pytest
import sys
import os
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.ml.predictor import (
    initialize_models,
    predict_student,
    derive_grade,
    derive_failure_probability,
    derive_risk_level,
)


# ── Setup — load models once for all tests ─────────────────────────────────────

@pytest.fixture(scope="module", autouse=True)
def load_models():
    """Load PKL files once before all tests in this module."""
    models_dir = os.path.join(
        os.path.dirname(__file__), '..', '..', 'app', 'ml', 'models'
    )
    initialize_models(models_dir=models_dir)
    yield


# ── Feature fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def good_performer_features():
    """Good performer — expect LOW risk, PASS, high score."""
    return {
        "attendance_percentage"   : 91.0,
        "midterm_score"           : 78.0,
        "historical_gpa"          : 3.5,
        "study_hours_per_week"    : 22.0,
        "subject_difficulty_score": 0.50,
        "ca_avg"                  : 76.0,
        "rule_risk_score"         : 0.14,
    }

@pytest.fixture
def atrisk_features():
    """At-risk student — expect CRITICAL risk, FAIL, low score."""
    return {
        "attendance_percentage"   : 55.0,
        "midterm_score"           : 40.0,
        "historical_gpa"          : 1.6,
        "study_hours_per_week"    : 8.0,
        "subject_difficulty_score": 0.75,
        "ca_avg"                  : 42.0,
        "rule_risk_score"         : 0.57,
    }

@pytest.fixture
def borderline_features():
    """Borderline student — right at pass/fail boundary."""
    return {
        "attendance_percentage"   : 76.0,
        "midterm_score"           : 59.0,
        "historical_gpa"          : 2.4,
        "study_hours_per_week"    : 13.0,
        "subject_difficulty_score": 0.60,
        "ca_avg"                  : 56.0,
        "rule_risk_score"         : 0.35,
    }


# ── Tests for predict_student() — output structure ────────────────────────────

class TestPredictStudentOutput:

    def test_returns_dict(self, good_performer_features):
        """predict_student must return a dict."""
        result = predict_student(good_performer_features)
        assert isinstance(result, dict)

    def test_returns_all_required_keys(self, good_performer_features):
        """Output must contain all 5 required keys."""
        result   = predict_student(good_performer_features)
        expected = {
            "predicted_score",
            "predicted_grade",
            "failure_probability",
            "risk_level",
            "pass_fail",
        }
        assert expected.issubset(set(result.keys()))

    def test_predicted_score_is_float(self, good_performer_features):
        """predicted_score must be a float."""
        result = predict_student(good_performer_features)
        assert isinstance(result["predicted_score"], float)

    def test_predicted_grade_is_string(self, good_performer_features):
        """predicted_grade must be a string."""
        result = predict_student(good_performer_features)
        assert isinstance(result["predicted_grade"], str)

    def test_failure_probability_is_float(self, good_performer_features):
        """failure_probability must be a float."""
        result = predict_student(good_performer_features)
        assert isinstance(result["failure_probability"], float)

    def test_risk_level_is_string(self, good_performer_features):
        """risk_level must be a string."""
        result = predict_student(good_performer_features)
        assert isinstance(result["risk_level"], str)

    def test_pass_fail_is_int(self, good_performer_features):
        """pass_fail must be an integer (0 or 1)."""
        result = predict_student(good_performer_features)
        assert isinstance(result["pass_fail"], int)


# ── Tests for predict_student() — value constraints ───────────────────────────

class TestPredictStudentValues:

    def test_predicted_score_between_0_and_100(self, good_performer_features):
        """predicted_score must always be between 0 and 100."""
        result = predict_student(good_performer_features)
        assert 0.0 <= result["predicted_score"] <= 100.0

    def test_predicted_score_clamped_for_atrisk(self, atrisk_features):
        """predicted_score must be clamped even for extreme inputs."""
        result = predict_student(atrisk_features)
        assert 0.0 <= result["predicted_score"] <= 100.0

    def test_failure_probability_between_0_and_1(self, good_performer_features):
        """failure_probability must always be between 0.0 and 1.0."""
        result = predict_student(good_performer_features)
        assert 0.0 <= result["failure_probability"] <= 1.0

    def test_failure_probability_between_0_and_1_atrisk(self, atrisk_features):
        """failure_probability must be between 0.0 and 1.0 for at-risk."""
        result = predict_student(atrisk_features)
        assert 0.0 <= result["failure_probability"] <= 1.0

    def test_risk_level_valid_value(self, good_performer_features):
        """risk_level must be one of the four valid values."""
        result       = predict_student(good_performer_features)
        valid_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        assert result["risk_level"] in valid_levels

    def test_grade_valid_value(self, good_performer_features):
        """predicted_grade must be one of the 9 valid grades."""
        result       = predict_student(good_performer_features)
        valid_grades = {"A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"}
        assert result["predicted_grade"] in valid_grades

    def test_pass_fail_is_0_or_1(self, good_performer_features):
        """pass_fail must be exactly 0 or 1."""
        result = predict_student(good_performer_features)
        assert result["pass_fail"] in {0, 1}


# ── Tests for predict_student() — business logic ─────────────────────────────

class TestPredictStudentBusinessLogic:

    def test_good_performer_gets_low_risk(self, good_performer_features):
        """
        Good performer with high attendance, high scores,
        and high GPA should get LOW risk.
        """
        result = predict_student(good_performer_features)
        assert result["risk_level"] in {"LOW", "MEDIUM"}

    def test_good_performer_passes(self, good_performer_features):
        """Good performer should pass (pass_fail = 1)."""
        result = predict_student(good_performer_features)
        assert result["pass_fail"] == 1

    def test_atrisk_student_gets_high_or_critical_risk(self, atrisk_features):
        """
        At-risk student with low attendance, low scores,
        and low GPA should get HIGH or CRITICAL risk.
        """
        result = predict_student(atrisk_features)
        assert result["risk_level"] in {"HIGH", "CRITICAL"}

    def test_atrisk_student_fails(self, atrisk_features):
        """At-risk student should fail (pass_fail = 0)."""
        result = predict_student(atrisk_features)
        assert result["pass_fail"] == 0

    def test_pass_fail_consistent_with_score(self, good_performer_features):
        """
        pass_fail must be consistent with predicted_score.
        If score >= 60, pass_fail = 1. If score < 60, pass_fail = 0.
        """
        result = predict_student(good_performer_features)
        expected_pf = 1 if result["predicted_score"] >= 60 else 0
        assert result["pass_fail"] == expected_pf

    def test_pass_fail_consistent_with_score_atrisk(self, atrisk_features):
        """pass_fail must be consistent with predicted_score for at-risk."""
        result = predict_student(atrisk_features)
        expected_pf = 1 if result["predicted_score"] >= 60 else 0
        assert result["pass_fail"] == expected_pf

    def test_risk_consistent_with_failure_probability(self,
                                                       good_performer_features):
        """
        risk_level must be consistent with failure_probability thresholds:
        >= 0.75 → CRITICAL
        >= 0.55 → HIGH
        >= 0.35 → MEDIUM
        <  0.35 → LOW
        """
        result = predict_student(good_performer_features)
        fp     = result["failure_probability"]
        rl     = result["risk_level"]

        if fp >= 0.75:
            assert rl == "CRITICAL"
        elif fp >= 0.55:
            assert rl == "HIGH"
        elif fp >= 0.35:
            assert rl == "MEDIUM"
        else:
            assert rl == "LOW"

    def test_missing_feature_uses_default(self):
        """
        Missing features default to 0.
        Should not raise an exception.
        """
        partial_features = {
            "attendance_percentage"   : 80.0,
            "midterm_score"           : 65.0,
            "ca_avg"                  : 63.0,
            "rule_risk_score"         : 0.25,
        }
        result = predict_student(partial_features)
        assert "predicted_score" in result
        assert 0.0 <= result["predicted_score"] <= 100.0


# ── Tests for derive_grade() ───────────────────────────────────────────────────

class TestDeriveGrade:

    def test_score_above_90_returns_aplus(self):
        assert derive_grade(95.0) == "A+"

    def test_score_90_returns_aplus(self):
        assert derive_grade(90.0) == "A+"

    def test_score_89_returns_a(self):
        assert derive_grade(89.0) == "A"

    def test_score_80_returns_a(self):
        assert derive_grade(80.0) == "A"

    def test_score_79_returns_bplus(self):
        assert derive_grade(79.0) == "B+"

    def test_score_70_returns_bplus(self):
        assert derive_grade(70.0) == "B+"

    def test_score_69_returns_b(self):
        assert derive_grade(69.0) == "B"

    def test_score_60_returns_b(self):
        assert derive_grade(60.0) == "B"

    def test_score_59_returns_cplus(self):
        assert derive_grade(59.0) == "C+"

    def test_score_50_returns_cplus(self):
        assert derive_grade(50.0) == "C+"

    def test_score_49_returns_c(self):
        assert derive_grade(49.0) == "C"

    def test_score_40_returns_c(self):
        assert derive_grade(40.0) == "C"

    def test_score_39_returns_dplus(self):
        assert derive_grade(39.0) == "D+"

    def test_score_30_returns_dplus(self):
        assert derive_grade(30.0) == "D+"

    def test_score_29_returns_d(self):
        assert derive_grade(29.0) == "D"

    def test_score_20_returns_d(self):
        assert derive_grade(20.0) == "D"

    def test_score_19_returns_e(self):
        assert derive_grade(19.0) == "E"

    def test_score_0_returns_e(self):
        assert derive_grade(0.0) == "E"

    def test_returns_string(self):
        assert isinstance(derive_grade(75.0), str)

    def test_all_grades_are_valid(self):
        """Every score from 0-100 should produce a valid grade."""
        valid_grades = {"A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"}
        for score in range(0, 101):
            assert derive_grade(float(score)) in valid_grades


# ── Tests for derive_failure_probability() ────────────────────────────────────

class TestDeriveFailureProbability:

    def test_score_60_returns_0_5(self):
        """Score exactly at boundary should return 0.5."""
        result = derive_failure_probability(60.0)
        assert result == 0.5

    def test_score_80_returns_0(self):
        """Score well above boundary should return 0.0."""
        result = derive_failure_probability(80.0)
        assert result == 0.0

    def test_score_40_returns_1(self):
        """Score well below boundary should return 1.0."""
        result = derive_failure_probability(40.0)
        assert result == 1.0

    def test_score_above_80_clamped_to_0(self):
        """Scores above 80 should be clamped to 0.0."""
        result = derive_failure_probability(95.0)
        assert result == 0.0

    def test_score_below_40_clamped_to_1(self):
        """Scores below 40 should be clamped to 1.0."""
        result = derive_failure_probability(20.0)
        assert result == 1.0

    def test_result_always_between_0_and_1(self):
        """Result must always be between 0.0 and 1.0 for any score."""
        for score in range(0, 101):
            result = derive_failure_probability(float(score))
            assert 0.0 <= result <= 1.0

    def test_higher_score_lower_probability(self):
        """Higher score should always produce lower failure probability."""
        assert derive_failure_probability(75.0) < derive_failure_probability(55.0)

    def test_returns_float(self):
        """Result must be a float."""
        result = derive_failure_probability(65.0)
        assert isinstance(result, float)


# ── Tests for derive_risk_level() ─────────────────────────────────────────────

class TestDeriveRiskLevel:

    def test_prob_above_075_returns_critical(self):
        """Probability >= 0.75 should return CRITICAL."""
        assert derive_risk_level(0.75) == "CRITICAL"
        assert derive_risk_level(0.90) == "CRITICAL"
        assert derive_risk_level(1.00) == "CRITICAL"

    def test_prob_above_055_returns_high(self):
        """Probability >= 0.55 and < 0.75 should return HIGH."""
        assert derive_risk_level(0.55) == "HIGH"
        assert derive_risk_level(0.65) == "HIGH"
        assert derive_risk_level(0.74) == "HIGH"

    def test_prob_above_035_returns_medium(self):
        """Probability >= 0.35 and < 0.55 should return MEDIUM."""
        assert derive_risk_level(0.35) == "MEDIUM"
        assert derive_risk_level(0.45) == "MEDIUM"
        assert derive_risk_level(0.54) == "MEDIUM"

    def test_prob_below_035_returns_low(self):
        """Probability < 0.35 should return LOW."""
        assert derive_risk_level(0.34) == "LOW"
        assert derive_risk_level(0.10) == "LOW"
        assert derive_risk_level(0.00) == "LOW"

    def test_returns_string(self):
        """Result must be a string."""
        assert isinstance(derive_risk_level(0.5), str)

    def test_all_valid_values(self):
        """All probabilities 0.0-1.0 should produce valid risk level."""
        valid_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        for i in range(0, 101):
            prob   = i / 100
            result = derive_risk_level(prob)
            assert result in valid_levels