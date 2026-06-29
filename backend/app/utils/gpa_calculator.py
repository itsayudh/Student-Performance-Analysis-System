def score_to_grade_point(score: float) -> float:
    """
    Convert a percentage score (0-100) to a 4.0 scale grade point.
    Matches SPAS official grading scale (Scale 2 column).
    """
    if score >= 90:
        return 4.00
    elif score >= 80:
        return 3.60
    elif score >= 70:
        return 3.20
    elif score >= 60:
        return 2.80
    elif score >= 50:
        return 2.40
    elif score >= 40:
        return 2.00
    elif score >= 30:
        return 1.60
    elif score >= 20:
        return 1.20
    else:
        return 0.00


def score_to_letter_grade(score: float) -> str:
    """
    Convert a percentage score (0-100) to a letter grade.
    Matches SPAS official grading scale (Grade column).
    """
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B+"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C+"
    elif score >= 40:
        return "C"
    elif score >= 30:
        return "D+"
    elif score >= 20:
        return "D"
    else:
        return "E"


def calculate_gpa(subjects: list) -> float:
    """
    Calculate weighted GPA across multiple subjects.

    Args:
        subjects: list of dicts, each containing:
            - credit_hours (int)
            - score (float, 0-100)

    Returns:
        float: weighted GPA on a 4.0 scale

    Raises:
        ValueError: if subjects list is empty or total credit hours is 0
    """
    if not subjects:
        raise ValueError("Cannot calculate GPA with an empty subject list")

    total_credit_hours = sum(s["credit_hours"] for s in subjects)
    if total_credit_hours == 0:
        raise ValueError("Total credit hours cannot be zero")

    weighted_sum = sum(
        s["credit_hours"] * score_to_grade_point(s["score"])
        for s in subjects
    )

    return round(weighted_sum / total_credit_hours, 2)


def calculate_weighted_score(quiz_avg: float, assignment_avg: float,
                              midterm: float, final: float = None) -> float:
    """
    Calculate the overall weighted percentage score for a subject.
    Weights from SPAS documentation Section 3.5.1:
        Quiz: 10%, Assignment: 10%, Midterm: 30%, Final: 50%

    If final is not yet entered, recalculate weights proportionally
    across the components that ARE available.
    """
    components = {
        "quiz":       (quiz_avg, 0.10),
        "assignment": (assignment_avg, 0.10),
        "midterm":    (midterm, 0.30),
        "final":      (final, 0.50),
    }

    available = {k: v for k, v in components.items() if v[0] is not None}

    if not available:
        return 0.0

    total_weight = sum(weight for _, weight in available.values())
    weighted_score = sum(score * weight for score, weight in available.values())

    return round(weighted_score / total_weight, 2) if total_weight > 0 else 0.0