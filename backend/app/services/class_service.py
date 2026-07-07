"""
class_service.py
================
SPAS Class Service — read-only operations.

NOTE (documented deviation): this file is not in the documentation's
Section 10 services list — the doc promises api/v1/classes.py but the
routers and services were never implemented. Added to unblock frontend
pickers (AnalyticsPage drill-down, ClassesPage). Write operations
(create/update/delete) intentionally NOT implemented here yet — CRUD
ownership is pending discussion (ClassesPage is Roshan's frontend).
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.class_ import Class


def get_classes(db: Session, page: int = 1, page_size: int = 25,
                search: str = None, department: str = None,
                academic_year: str = None, is_active: bool = None):
    """
    Paginated class list. Mirrors student_service.get_students' contract:
    returns { total, page, page_size, items } so the frontend can reuse
    the exact same picker/pagination logic it already has for students.
    """
    query = db.query(Class)

    if search:
        # Match either the human name or the institutional code —
        # same dual-field search behavior as the students endpoint.
        query = query.filter(
            or_(
                Class.class_name.ilike(f"%{search}%"),
                Class.class_code.ilike(f"%{search}%"),
            )
        )
    if department:
        query = query.filter(Class.department == department)
    if academic_year:
        query = query.filter(Class.academic_year == academic_year)
    if is_active is not None:
        query = query.filter(Class.is_active == is_active)

    total = query.count()

    records = (
        query.order_by(Class.class_code.asc())
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
                "id": str(c.id),
                "class_name": c.class_name,
                "class_code": c.class_code,
                "program": c.program,
                "department": c.department,
                "semester": c.semester,
                "academic_year": c.academic_year,
                "is_active": c.is_active,
            }
            for c in records
        ],
    }


def get_class_by_id(db: Session, class_id: str):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    return {
        "id": str(class_obj.id),
        "class_name": class_obj.class_name,
        "class_code": class_obj.class_code,
        "program": class_obj.program,
        "department": class_obj.department,
        "semester": class_obj.semester,
        "academic_year": class_obj.academic_year,
        "homeroom_teacher_id": (
            str(class_obj.homeroom_teacher_id)
            if class_obj.homeroom_teacher_id else None
        ),
        "is_active": class_obj.is_active,
    }