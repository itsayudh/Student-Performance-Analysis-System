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