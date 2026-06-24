import pandas as pd
from datetime import datetime, date
from io import BytesIO


def parse_attendance_excel(file_bytes: BytesIO) -> dict:
    """
    Parse and validate an attendance Excel file.
    Required columns: Student ID, Date, Subject Code, Status (P/A/L)

    Returns:
        dict: {"valid_rows": [...], "errors": [...]}
    """
    try:
        df = pd.read_excel(file_bytes)
    except Exception as e:
        return {"valid_rows": [], "errors": [f"Could not read Excel file: {str(e)}"]}

    required_columns = ["Student ID", "Date", "Subject Code", "Status"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {
            "valid_rows": [],
            "errors": [f"Missing required columns: {', '.join(missing_columns)}"]
        }

    valid_rows = []
    errors = []
    status_map = {"P": "PRESENT", "A": "ABSENT", "L": "LATE"}

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel rows are 1-indexed + header row

        student_id = row.get("Student ID")
        att_date   = row.get("Date")
        subject    = row.get("Subject Code")
        status_raw = row.get("Status")

        if pd.isna(student_id):
            errors.append(f"Row {row_num}: Student ID is empty")
            continue
        if pd.isna(att_date):
            errors.append(f"Row {row_num}: Date is empty")
            continue
        if pd.isna(subject):
            errors.append(f"Row {row_num}: Subject Code is empty")
            continue
        if pd.isna(status_raw):
            errors.append(f"Row {row_num}: Status is empty")
            continue

        status_str = str(status_raw).strip().upper()
        if status_str not in status_map:
            errors.append(f"Row {row_num}: Invalid status '{status_raw}'. Must be P, A, or L")
            continue

        try:
            if isinstance(att_date, (datetime, date)):
                parsed_date = att_date
            else:
                parsed_date = pd.to_datetime(att_date).date()
        except Exception:
            errors.append(f"Row {row_num}: Invalid date format '{att_date}'")
            continue

        if parsed_date > date.today():
            errors.append(f"Row {row_num}: Date cannot be in the future")
            continue

        valid_rows.append({
            "student_code": str(student_id).strip(),
            "attendance_date": parsed_date,
            "subject_code": str(subject).strip(),
            "status": status_map[status_str]
        })

    return {"valid_rows": valid_rows, "errors": errors}


def parse_marks_excel(file_bytes: BytesIO) -> dict:
    """
    Parse and validate a marks Excel file.
    Required columns: Student ID, Subject Code, Type, Score, Max Score

    Returns:
        dict: {"valid_rows": [...], "errors": [...]}
    """
    try:
        df = pd.read_excel(file_bytes)
    except Exception as e:
        return {"valid_rows": [], "errors": [f"Could not read Excel file: {str(e)}"]}

    required_columns = ["Student ID", "Subject Code", "Type", "Score", "Max Score"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {
            "valid_rows": [],
            "errors": [f"Missing required columns: {', '.join(missing_columns)}"]
        }

    valid_rows = []
    errors = []
    valid_types = {"QUIZ", "ASSIGNMENT", "MIDTERM", "FINAL"}

    for idx, row in df.iterrows():
        row_num = idx + 2

        student_id  = row.get("Student ID")
        subject     = row.get("Subject Code")
        mark_type   = row.get("Type")
        score       = row.get("Score")
        max_score   = row.get("Max Score")

        if pd.isna(student_id):
            errors.append(f"Row {row_num}: Student ID is empty")
            continue
        if pd.isna(subject):
            errors.append(f"Row {row_num}: Subject Code is empty")
            continue
        if pd.isna(mark_type):
            errors.append(f"Row {row_num}: Type is empty")
            continue
        if pd.isna(score):
            errors.append(f"Row {row_num}: Score is empty")
            continue
        if pd.isna(max_score):
            errors.append(f"Row {row_num}: Max Score is empty")
            continue

        type_str = str(mark_type).strip().upper()
        if type_str not in valid_types:
            errors.append(f"Row {row_num}: Invalid type '{mark_type}'. Must be QUIZ, ASSIGNMENT, MIDTERM, or FINAL")
            continue

        try:
            score_val = float(score)
            max_score_val = float(max_score)
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: Score and Max Score must be numbers")
            continue

        if score_val < 0:
            errors.append(f"Row {row_num}: Score cannot be negative")
            continue
        if max_score_val <= 0:
            errors.append(f"Row {row_num}: Max Score must be greater than 0")
            continue
        if score_val > max_score_val:
            errors.append(f"Row {row_num}: Score ({score_val}) exceeds Max Score ({max_score_val})")
            continue

        valid_rows.append({
            "student_code": str(student_id).strip(),
            "subject_code": str(subject).strip(),
            "mark_type": type_str,
            "score": score_val,
            "max_score": max_score_val
        })

    return {"valid_rows": valid_rows, "errors": errors}