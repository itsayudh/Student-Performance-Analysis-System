import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.marks import Marks
from app.utils.excel_parser import parse_attendance_excel, parse_marks_excel


def import_attendance(db: Session, file_bytes, current_user_id: str, class_id: str) -> dict:
    parsed = parse_attendance_excel(file_bytes)

    if parsed["errors"]:
        return {
            "inserted": 0,
            "updated": 0,
            "errors": parsed["errors"]
        }

    inserted = 0
    skipped = 0
    row_errors = []

    for row in parsed["valid_rows"]:
        student = db.query(Student).filter(
            Student.student_code == row["student_code"]
        ).first()
        if not student:
            row_errors.append(f"Student code '{row['student_code']}' not found in database")
            skipped += 1
            continue

        subject = db.query(Subject).filter(
            Subject.subject_code == row["subject_code"]
        ).first()
        if not subject:
            row_errors.append(f"Subject code '{row['subject_code']}' not found in database")
            skipped += 1
            continue

        existing = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.subject_id == subject.id,
            Attendance.attendance_date == row["attendance_date"]
        ).first()
        if existing:
            skipped += 1
            continue

        attendance = Attendance(
            id              = uuid.uuid4(),
            student_id      = student.id,
            class_id        = class_id,
            subject_id      = subject.id,
            attendance_date = row["attendance_date"],
            status          = row["status"],
            recorded_by     = current_user_id,
        )
        db.add(attendance)
        inserted += 1

    db.commit()

    return {
        "inserted": inserted,
        "updated": 0,
        "skipped": skipped,
        "errors": row_errors
    }


def import_marks(db: Session, file_bytes, current_user_id: str, class_id: str) -> dict:
    parsed = parse_marks_excel(file_bytes)

    if parsed["errors"]:
        return {
            "inserted": 0,
            "updated": 0,
            "errors": parsed["errors"]
        }

    inserted = 0
    skipped = 0
    row_errors = []

    for row in parsed["valid_rows"]:
        student = db.query(Student).filter(
            Student.student_code == row["student_code"]
        ).first()
        if not student:
            row_errors.append(f"Student code '{row['student_code']}' not found in database")
            skipped += 1
            continue

        subject = db.query(Subject).filter(
            Subject.subject_code == row["subject_code"]
        ).first()
        if not subject:
            row_errors.append(f"Subject code '{row['subject_code']}' not found in database")
            skipped += 1
            continue

        mark = Marks(
            id          = uuid.uuid4(),
            student_id  = student.id,
            subject_id  = subject.id,
            class_id    = class_id,
            mark_type   = row["mark_type"],
            score       = row["score"],
            max_score   = row["max_score"],
            recorded_by = current_user_id,
        )
        db.add(mark)
        inserted += 1

    db.commit()

    return {
        "inserted": inserted,
        "updated": 0,
        "skipped": skipped,
        "errors": row_errors
    }