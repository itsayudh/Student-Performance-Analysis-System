"""
subject_service.py
==================
SPAS Subject Service — read-only operations.
Same documented-deviation note as class_service.py.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.subject import Subject
import uuid


def get_subjects(db: Session, page: int = 1, page_size: int = 25,
                 search: str = None, department: str = None,
                 is_active: bool = None):
    query = db.query(Subject)

    if search:
        query = query.filter(
            or_(
                Subject.subject_name.ilike(f"%{search}%"),
                Subject.subject_code.ilike(f"%{search}%"),
            )
        )
    if department:
        query = query.filter(Subject.department == department)
    if is_active is not None:
        query = query.filter(Subject.is_active == is_active)

    total = query.count()

    records = (
        query.order_by(Subject.subject_code.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": str(s.id),
                "subject_name": s.subject_name,
                "subject_code": s.subject_code,
                "credit_hours": s.credit_hours,
                "department": s.department,
                "is_active": s.is_active,
            }
            for s in records
        ],
    }


def get_subject_by_id(db: Session, subject_id: str):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    return {
        "id": str(subject.id),
        "subject_name": subject.subject_name,
        "subject_code": subject.subject_code,
        "credit_hours": subject.credit_hours,
        "department": subject.department,
        "is_active": subject.is_active,
    }

import uuid


def create_subject(db: Session, data: dict):
    existing = db.query(Subject).filter(Subject.subject_code == data["subject_code"]).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Subject code '{data['subject_code']}' already exists"
        )

    subject = Subject(
        id           = uuid.uuid4(),
        subject_name = data["subject_name"],
        subject_code = data["subject_code"],
        department   = data["department"],
        credit_hours = data.get("credit_hours", 3),
        is_active    = True,
    )
    db.add(subject)
    db.commit()

    return get_subject_by_id(db, str(subject.id))


def update_subject(db: Session, subject_id: str, data: dict):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # data arrives pre-filtered by exclude_unset in the router —
    # same partial-update contract as update_class/update_student.
    for field, value in data.items():
        setattr(subject, field, value)

    db.commit()
    return get_subject_by_id(db, subject_id)


def delete_subject(db: Session, subject_id: str):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Soft delete — same reasoning as class/student/teacher: existing
    # ClassSubject/Attendance/Marks rows keep pointing at a real subject;
    # it just stops appearing in is_active=True listings and pickers.
    subject.is_active = False
    db.commit()

    return {"message": f"Subject '{subject.subject_code}' deactivated"}