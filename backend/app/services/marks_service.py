import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from fastapi import HTTPException

from app.models.marks import Marks, GPARecord
from app.models.subject import Subject
from app.utils.gpa_calculator import (
    score_to_letter_grade, calculate_weighted_score, calculate_gpa
)


def record_marks(db: Session, current_user_id: str, data: dict):
    class_id   = data["class_id"]
    subject_id = data["subject_id"]
    mark_type  = data["mark_type"]
    max_score  = data["max_score"]
    records    = data["records"]

    scores = []

    for record in records:
        mark = Marks(
            id          = uuid.uuid4(),
            student_id  = record["student_id"],
            subject_id  = subject_id,
            class_id    = class_id,
            mark_type   = mark_type,
            score       = record["score"],
            max_score   = max_score,
            recorded_by = current_user_id,
        )
        db.add(mark)
        scores.append(record["score"])

    db.commit()

    class_avg = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "message":   f"Marks saved for {len(records)} students",
        "mark_type": mark_type,
        "class_avg": class_avg
    }


def get_student_marks(db: Session, student_id: str, subject_id: str = None, mark_type: str = None):
    query = db.query(Marks).filter(Marks.student_id == student_id)

    if subject_id:
        query = query.filter(Marks.subject_id == subject_id)
    if mark_type:
        query = query.filter(Marks.mark_type == mark_type)

    records = query.all()

    # FIX: batch-fetch subject info once so subject_code/subject_name can be
    # populated below. Without this, the MarksSubjectBreakdown schema's
    # subject_code/subject_name fields are promised but never filled in.
    subject_ids = {r.subject_id for r in records}
    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all() if subject_ids else []
    subject_lookup = {
        str(s.id): {"subject_code": s.subject_code, "subject_name": s.subject_name}
        for s in subjects
    }

    def _subject_info(sid):
        return subject_lookup.get(str(sid), {"subject_code": None, "subject_name": None})

    by_subject_map = {}
    for r in records:
        sid = str(r.subject_id)
        by_subject_map.setdefault(sid, {"quiz": [], "assignment": [], "midterm": None, "final": None})

        pct = round((r.score / r.max_score * 100), 2) if r.max_score > 0 else 0.0

        if r.mark_type == "QUIZ":
            by_subject_map[sid]["quiz"].append({"score": r.score, "max_score": r.max_score})
        elif r.mark_type == "ASSIGNMENT":
            by_subject_map[sid]["assignment"].append({"score": r.score, "max_score": r.max_score})
        elif r.mark_type == "MIDTERM":
            by_subject_map[sid]["midterm"] = {"score": r.score, "max_score": r.max_score}
        elif r.mark_type == "FINAL":
            by_subject_map[sid]["final"] = {"score": r.score, "max_score": r.max_score}

    marks_list = []
    for sid, data in by_subject_map.items():
        quiz_avg = (
            sum(q["score"] / q["max_score"] * 100 for q in data["quiz"]) / len(data["quiz"])
            if data["quiz"] else None
        )
        assignment_avg = (
            sum(a["score"] / a["max_score"] * 100 for a in data["assignment"]) / len(data["assignment"])
            if data["assignment"] else None
        )
        midterm_pct = (
            round(data["midterm"]["score"] / data["midterm"]["max_score"] * 100, 2)
            if data["midterm"] else None
        )
        final_pct = (
            round(data["final"]["score"] / data["final"]["max_score"] * 100, 2)
            if data["final"] else None
        )

        current_percentage = calculate_weighted_score(
            quiz_avg or 0, assignment_avg or 0, midterm_pct or 0, final_pct
        )
        current_grade = score_to_letter_grade(current_percentage)

        info = _subject_info(sid)

        marks_list.append({
            "subject_id": sid,
            "subject_code": info["subject_code"],
            "subject_name": info["subject_name"],
            "quiz": data["quiz"],
            "assignment": data["assignment"],
            "midterm": data["midterm"],
            "final": data["final"],
            "current_percentage": current_percentage,
            "current_grade": current_grade
        })

    return {
        "student_id": student_id,
        "marks": marks_list
    }


def update_mark(db: Session, mark_id: str, score: float, update_reason: str = None):
    mark = db.query(Marks).filter(Marks.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark record not found")

    if score > mark.max_score:
        raise HTTPException(
            status_code=422,
            detail=f"Score {score} exceeds max_score {mark.max_score}"
        )

    mark.score = score
    db.commit()
    db.refresh(mark)

    return {"id": str(mark.id), "message": "Mark updated successfully"}


def calculate_student_gpa(db: Session, student_id: str, semester: str, academic_year: str, subjects: list):
    """
    subjects: list of dicts [{"credit_hours": int, "score": float}, ...]
    """
    gpa = calculate_gpa(subjects)

    previous_records = db.query(GPARecord).filter(
        GPARecord.student_id == student_id
    ).order_by(GPARecord.calculated_at.desc()).all()

    if previous_records:
        all_gpas = [r.gpa for r in previous_records] + [gpa]
        cgpa = round(sum(all_gpas) / len(all_gpas), 2)
    else:
        cgpa = gpa

    record = GPARecord(
        id            = uuid.uuid4(),
        student_id    = student_id,
        semester      = semester,
        academic_year = academic_year,
        gpa           = gpa,
        cgpa          = cgpa,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "student_id": student_id,
        "semester": semester,
        "academic_year": academic_year,
        "gpa": gpa,
        "cgpa": cgpa
    }