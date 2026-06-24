"""
test_feature_engineering.py
===========================
Unit tests for app/ml/feature_engineering.py

Tests cover:
    - compute_ca_avg()
    - compute_rule_risk_score()
    - preprocess_input() — valid input
    - preprocess_input() — missing fields
    - preprocess_input() — out of range values
    - preprocess_input() — boundary values
    - preprocess_input() — output keys and order
"""

import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.ml.feature_engineering import (
    compute_ca_avg,
    compute_rule_risk_score,
    preprocess_input,
)


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture
def valid_input():
    """Standard valid input — good performer."""
    return {
        "attendance_percentage"   : 88.0,
        "midterm_score"           : 74.0,
        "historical_gpa"          : 3.2,
        "study_hours_per_week"    : 18.0,
        "subject_difficulty_score": 0.65,
        "quiz_score_avg"          : 72.0,
        "assignment_score_avg"    : 70.0,
    }

@pytest.fixture
def atrisk_input():
    """At-risk student input."""
    return {
        "attendance_percentage"   : 55.0,
        "midterm_score"           : 42.0,
        "historical_gpa"          : 1.8,
        "study_hours_per_week"    : 8.0,
        "subject_difficulty_score": 0.72,
        "quiz_score_avg"          : 44.0,
        "assignment_score_avg"    : 46.0,
    }

@pytest.fixture
def boundary_input():
    """Boundary values — exactly at pass/fail threshold."""
    return {
        "attendance_percentage"   : 60.0,
        "midterm_score"           : 60.0,
        "historical_gpa"          : 2.0,
        "study_hours_per_week"    : 10.0,
        "subject_difficulty_score": 0.5,
        "quiz_score_avg"          : 50.0,
        "assignment_score_avg"    : 50.0,
    }


# ── Tests for compute_ca_avg() ─────────────────────────────────────────────────

class TestComputeCaAvg:

    def test_equal_scores(self):
        """Equal quiz and assignment scores should return same value."""
        result = compute_ca_avg(70.0, 70.0)
        assert result == 70.0

    def test_different_scores(self):
        """Average of 80 and 60 should be 70."""
        result = compute_ca_avg(80.0, 60.0)
        assert result == 70.0

    def test_zero_scores(self):
        """Both zero should return 0."""
        result = compute_ca_avg(0.0, 0.0)
        assert result == 0.0

    def test_max_scores(self):
        """Both 100 should return 100."""
        result = compute_ca_avg(100.0, 100.0)
        assert result == 100.0

    def test_returns_float(self):
        """Result must be a float."""
        result = compute_ca_avg(72.0, 70.0)
        assert isinstance(result, float)

    def test_rounded_to_4_decimal_places(self):
        """Result should be rounded to 4 decimal places."""
        result = compute_ca_avg(72.3, 70.1)
        assert len(str(result).split('.')[-1]) <= 4

    def test_formula_correct(self):
        """Verify exact formula: (quiz * 0.5) + (assignment * 0.5)."""
        quiz   = 72.0
        assign = 68.0
        expected = (quiz * 0.5) + (assign * 0.5)
        assert compute_ca_avg(quiz, assign) == round(expected, 4)


# ── Tests for compute_rule_risk_score() ───────────────────────────────────────

class TestComputeRuleRiskScore:

    def test_perfect_student_low_risk(self):
        """Perfect scores should give very low risk."""
        result = compute_rule_risk_score(
            attendance_percentage = 100.0,
            ca_avg                = 100.0,
            midterm_score         = 100.0,
        )
        assert result == 0.0

    def test_zero_scores_max_risk(self):
        """All zeros should give maximum risk of 1.0."""
        result = compute_rule_risk_score(
            attendance_percentage = 0.0,
            ca_avg                = 0.0,
            midterm_score         = 0.0,
        )
        assert result == 1.0

    def test_result_between_0_and_1(self):
        """Risk score must always be between 0.0 and 1.0."""
        result = compute_rule_risk_score(55.0, 48.0, 42.0)
        assert 0.0 <= result <= 1.0

    def test_returns_float(self):
        """Result must be a float."""
        result = compute_rule_risk_score(80.0, 70.0, 65.0)
        assert isinstance(result, float)

    def test_higher_attendance_lower_risk(self):
        """Higher attendance should produce lower risk score."""
        risk_low_att  = compute_rule_risk_score(50.0, 65.0, 60.0)
        risk_high_att = compute_rule_risk_score(90.0, 65.0, 60.0)
        assert risk_high_att < risk_low_att

    def test_formula_weights_correct(self):
        """
        Verify exact formula:
        ((100-att)*0.4 + (100-ca)*0.3 + (100-mid)*0.3) / 100
        """
        att = 80.0
        ca  = 70.0
        mid = 65.0
        expected = (
            (100 - att) * 0.4 +
            (100 - ca)  * 0.3 +
            (100 - mid) * 0.3
        ) / 100
        result = compute_rule_risk_score(att, ca, mid)
        assert abs(result - round(expected, 4)) < 0.0001

    def test_rounded_to_4_decimal_places(self):
        """Result should be rounded to 4 decimal places."""
        result = compute_rule_risk_score(76.3, 57.1, 59.4)
        assert len(str(result).split('.')[-1]) <= 4


# ── Tests for preprocess_input() — valid input ────────────────────────────────

class TestPreprocessInputValid:

    def test_returns_dict(self, valid_input):
        """Output must be a dict."""
        result = preprocess_input(valid_input)
        assert isinstance(result, dict)

    def test_output_has_exactly_7_keys(self, valid_input):
        """Output must have exactly 7 keys."""
        result = preprocess_input(valid_input)
        assert len(result) == 7

    def test_output_has_correct_keys(self, valid_input):
        """Output must contain exactly the 7 model feature keys."""
        result   = preprocess_input(valid_input)
        expected = {
            "attendance_percentage",
            "midterm_score",
            "historical_gpa",
            "study_hours_per_week",
            "subject_difficulty_score",
            "ca_avg",
            "rule_risk_score",
        }
        assert set(result.keys()) == expected

    def test_raw_fields_passed_through_correctly(self, valid_input):
        """Raw fields should pass through unchanged."""
        result = preprocess_input(valid_input)
        assert result["attendance_percentage"]    == valid_input["attendance_percentage"]
        assert result["midterm_score"]            == valid_input["midterm_score"]
        assert result["historical_gpa"]           == valid_input["historical_gpa"]
        assert result["study_hours_per_week"]     == valid_input["study_hours_per_week"]
        assert result["subject_difficulty_score"] == valid_input["subject_difficulty_score"]

    def test_quiz_and_assignment_not_in_output(self, valid_input):
        """
        quiz_score_avg and assignment_score_avg must NOT
        appear in output — they were dropped during feature
        selection due to multicollinearity with ca_avg.
        """
        result = preprocess_input(valid_input)
        assert "quiz_score_avg"       not in result
        assert "assignment_score_avg" not in result

    def test_ca_avg_computed_correctly(self, valid_input):
        """ca_avg must equal (quiz * 0.5) + (assignment * 0.5)."""
        result   = preprocess_input(valid_input)
        expected = (
            valid_input["quiz_score_avg"] * 0.5 +
            valid_input["assignment_score_avg"] * 0.5
        )
        assert abs(result["ca_avg"] - expected) < 0.0001

    def test_rule_risk_score_between_0_and_1(self, valid_input):
        """rule_risk_score must always be between 0.0 and 1.0."""
        result = preprocess_input(valid_input)
        assert 0.0 <= result["rule_risk_score"] <= 1.0

    def test_good_performer_low_risk(self, valid_input):
        """
        Good performer (high attendance, high scores)
        should have low rule_risk_score.
        """
        result = preprocess_input(valid_input)
        assert result["rule_risk_score"] < 0.35

    def test_atrisk_student_high_risk(self, atrisk_input):
        """
        At-risk student (low attendance, low scores)
        should have high rule_risk_score.
        """
        result = preprocess_input(atrisk_input)
        assert result["rule_risk_score"] > 0.35

    def test_boundary_values_accepted(self, boundary_input):
        """Boundary values exactly at valid range limits should not raise."""
        result = preprocess_input(boundary_input)
        assert result is not None


# ── Tests for preprocess_input() — missing fields ─────────────────────────────

class TestPreprocessInputMissingFields:

    def test_missing_attendance_raises(self, valid_input):
        """Missing attendance_percentage should raise ValueError."""
        del valid_input["attendance_percentage"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_midterm_raises(self, valid_input):
        """Missing midterm_score should raise ValueError."""
        del valid_input["midterm_score"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_gpa_raises(self, valid_input):
        """Missing historical_gpa should raise ValueError."""
        del valid_input["historical_gpa"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_quiz_raises(self, valid_input):
        """Missing quiz_score_avg should raise ValueError."""
        del valid_input["quiz_score_avg"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_assignment_raises(self, valid_input):
        """Missing assignment_score_avg should raise ValueError."""
        del valid_input["assignment_score_avg"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_study_hours_raises(self, valid_input):
        """Missing study_hours_per_week should raise ValueError."""
        del valid_input["study_hours_per_week"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_missing_difficulty_raises(self, valid_input):
        """Missing subject_difficulty_score should raise ValueError."""
        del valid_input["subject_difficulty_score"]
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input(valid_input)

    def test_empty_dict_raises(self):
        """Completely empty input should raise ValueError."""
        with pytest.raises(ValueError, match="Missing required fields"):
            preprocess_input({})


# ── Tests for preprocess_input() — out of range values ───────────────────────

class TestPreprocessInputOutOfRange:

    def test_attendance_above_100_raises(self, valid_input):
        """Attendance above 100 should raise ValueError."""
        valid_input["attendance_percentage"] = 150.0
        with pytest.raises(ValueError, match="attendance_percentage"):
            preprocess_input(valid_input)

    def test_attendance_below_0_raises(self, valid_input):
        """Negative attendance should raise ValueError."""
        valid_input["attendance_percentage"] = -5.0
        with pytest.raises(ValueError, match="attendance_percentage"):
            preprocess_input(valid_input)

    def test_midterm_above_100_raises(self, valid_input):
        """Midterm above 100 should raise ValueError."""
        valid_input["midterm_score"] = 105.0
        with pytest.raises(ValueError, match="midterm_score"):
            preprocess_input(valid_input)

    def test_gpa_above_4_raises(self, valid_input):
        """GPA above 4.0 should raise ValueError."""
        valid_input["historical_gpa"] = 4.5
        with pytest.raises(ValueError, match="historical_gpa"):
            preprocess_input(valid_input)

    def test_gpa_below_0_raises(self, valid_input):
        """Negative GPA should raise ValueError."""
        valid_input["historical_gpa"] = -0.5
        with pytest.raises(ValueError, match="historical_gpa"):
            preprocess_input(valid_input)

    def test_difficulty_above_1_raises(self, valid_input):
        """Difficulty score above 1.0 should raise ValueError."""
        valid_input["subject_difficulty_score"] = 1.5
        with pytest.raises(ValueError, match="subject_difficulty_score"):
            preprocess_input(valid_input)

    def test_difficulty_below_0_raises(self, valid_input):
        """Negative difficulty score should raise ValueError."""
        valid_input["subject_difficulty_score"] = -0.1
        with pytest.raises(ValueError, match="subject_difficulty_score"):
            preprocess_input(valid_input)

    def test_quiz_above_100_raises(self, valid_input):
        """Quiz score above 100 should raise ValueError."""
        valid_input["quiz_score_avg"] = 110.0
        with pytest.raises(ValueError, match="quiz_score_avg"):
            preprocess_input(valid_input)

    def test_assignment_below_0_raises(self, valid_input):
        """Negative assignment score should raise ValueError."""
        valid_input["assignment_score_avg"] = -10.0
        with pytest.raises(ValueError, match="assignment_score_avg"):
            preprocess_input(valid_input)