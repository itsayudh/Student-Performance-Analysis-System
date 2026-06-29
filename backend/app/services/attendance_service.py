import uuid
from datetime import date as date_type
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject


def record_attendance(db: Session, current_user_id: str, data: dict):
    class_id        = data["class_id"]
    subject_id      = data["subject_id"]
    attendance_date = data["attendance_date"]
    records         = data["records"]

    existing = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.subject_id == subject_id,
        Attendance.attendance_date == attendance_date
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Attendance already recorded for this class/subject/date. Use PUT to update."
        )

    present_count = 0
    absent_count  = 0
    late_count    = 0

    for record in records:
        attendance = Attendance(
            id              = uuid.uuid4(),
            student_id      = record["student_id"],
            class_id        = class_id,
            subject_id      = subject_id,
            attendance_date = attendance_date,
            status          = record["status"],
            recorded_by     = current_user_id,
        )
        db.add(attendance)

        if record["status"] == "PRESENT":
            present_count += 1
        elif record["status"] == "ABSENT":
            absent_count += 1
        elif record["status"] == "LATE":
            late_count += 1

    db.commit()

    return {
        "message":    f"Attendance recorded for {len(records)} students",
        "date":       str(attendance_date),
        "class_id":   class_id,
        "subject_id": subject_id,
        "present":    present_count,
        "absent":     absent_count,
        "late":       late_count
    }


def get_student_attendance(
    db: Session,
    student_id: str,
    subject_id: str = None,
    start_date: date_type = None,
    end_date: date_type = None,
    status: str = None
):
    query = db.query(Attendance).filter(Attendance.student_id == student_id)

    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if start_date:
        query = query.filter(Attendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(Attendance.attendance_date <= end_date)
    if status:
        query = query.filter(Attendance.status == status)

    records = query.order_by(Attendance.attendance_date.desc()).all()

    # FIX: build a subject_id -> (code, name) lookup so responses can show
    # readable subject info instead of raw UUIDs. Fetched once, not per-row,
    # to avoid N+1 queries.
    subject_ids = {r.subject_id for r in records}
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    subject_lookup = {
        str(s.id): {"subject_code": s.subject_code, "subject_name": s.subject_name}
        for s in subjects
    }

    def _subject_info(sid):
        return subject_lookup.get(str(sid), {"subject_code": None, "subject_name": None})

    total = len(records)
    present = sum(1 for r in records if r.status == "PRESENT")
    absent  = sum(1 for r in records if r.status == "ABSENT")
    late    = sum(1 for r in records if r.status == "LATE")

    overall_percentage = round((present / total * 100), 2) if total > 0 else 0.0

    by_subject_map = {}
    for r in records:
        sid = str(r.subject_id)
        by_subject_map.setdefault(sid, {"total": 0, "present": 0})
        by_subject_map[sid]["total"] += 1
        if r.status == "PRESENT":
            by_subject_map[sid]["present"] += 1

    by_subject = []
    for sid, counts in by_subject_map.items():
        pct = round((counts["present"] / counts["total"] * 100), 2) if counts["total"] > 0 else 0.0
        info = _subject_info(sid)
        by_subject.append({
            "subject_id": sid,
            "subject_code": info["subject_code"],
            "subject_name": info["subject_name"],
            "percentage": pct,
            "status": "WARNING" if pct < 75 else "OK"
        })

    return {
        "student_id": student_id,
        "records": [
            {
                "date": str(r.attendance_date),
                "subject_id": str(r.subject_id),
                "subject_code": _subject_info(r.subject_id)["subject_code"],
                "subject_name": _subject_info(r.subject_id)["subject_name"],
                "status": r.status
            } for r in records
        ],
        "summary": {
            "total_days": total,
            "present": present,
            "absent": absent,
            "late": late,
            "overall_percentage": overall_percentage,
            "by_subject": by_subject
        }
    }


def get_class_attendance(db: Session, class_id: str, subject_id: str = None, month: int = None, year: int = None):
    query = db.query(Attendance).filter(Attendance.class_id == class_id)

    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if month:
        query = query.filter(func.extract('month', Attendance.attendance_date) == month)
    if year:
        query = query.filter(func.extract('year', Attendance.attendance_date) == year)

    records = query.all()

    total = len(records)
    present = sum(1 for r in records if r.status == "PRESENT")
    attendance_rate = round((present / total * 100), 2) if total > 0 else 0.0

    return {
        "class_id": class_id,
        "total_records": total,
        "attendance_rate": attendance_rate
    }