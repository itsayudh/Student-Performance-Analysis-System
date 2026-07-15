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

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.class_ import Class, ClassSubject
from app.models.subject import Subject
from app.models.teacher import Teacher

from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.enrollment import Enrollment




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

def get_class_students(db: Session, class_id: str):
    """
    Roster: active students ACTIVE-enrolled in this class. Serves the
    MarksPage/AttendancePage bulk-entry forms and ClassesPage detail.
    (Added alongside the read-only endpoints — same documented-deviation
    family; the enrollments table existed but nothing exposed it.)
    """
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    students = (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(
            Enrollment.class_id == class_id,
            Enrollment.status == "ACTIVE",
            Student.is_active == True,
        )
        .order_by(Student.student_code.asc())
        .all()
    )

    return {
        "class_id": class_id,
        "total": len(students),
        "items": [
            {
                "id": str(s.id),
                "student_code": s.student_code,
                "first_name": s.first_name,
                "last_name": s.last_name,
            }
            for s in students
        ],
    }

def create_class(db: Session, data: dict):
    # Duplicate check FIRST for a friendly 409 — otherwise the DB's
    # unique constraint fires and the user gets an ugly 500.
    existing = db.query(Class).filter(Class.class_code == data["class_code"]).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Class code '{data['class_code']}' already exists")

    class_obj = Class(
        id                  = uuid.uuid4(),
        class_name          = data["class_name"],
        class_code          = data["class_code"],
        program             = data["program"],
        department          = data["department"],
        semester            = data["semester"],
        academic_year       = data["academic_year"],
        homeroom_teacher_id = data.get("homeroom_teacher_id"),
        is_active           = True,
    )
    db.add(class_obj)
    db.commit()

    return get_class_by_id(db, str(class_obj.id))


def update_class(db: Session, class_id: str, data: dict):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # data arrives pre-filtered by exclude_unset — only fields the
    # caller actually sent. setattr loop = the standard partial update.
    for field, value in data.items():
        setattr(class_obj, field, value)

    db.commit()
    return get_class_by_id(db, class_id)


def delete_class(db: Session, class_id: str):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Soft delete (doc 3.2.3 pattern): history — attendance, marks,
    # enrollments — keeps pointing at a real row; the class just stops
    # appearing in is_active=True listings.
    class_obj.is_active = False
    db.commit()

    return {"message": f"Class '{class_obj.class_code}' deactivated"}

def assign_subject_to_class(db: Session, class_id: str, subject_id: str, teacher_id: str):
    """
    Creates a ClassSubject row: 'teacher T teaches subject S in class C'.
    This is the doc's 3.3.3 assignment mechanism, implemented over the
    stricter model the DB actually has (assignment is always the triple,
    never subject-only — recorded deviation from doc 3.3.2 prose).
    """
    # Validate all three legs exist — a FK violation would 500;
    # named 404s tell the caller exactly which id is wrong.
    if not db.query(Class).filter(Class.id == class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")
    if not db.query(Subject).filter(Subject.id == subject_id).first():
        raise HTTPException(status_code=404, detail="Subject not found")
    if not db.query(Teacher).filter(Teacher.id == teacher_id).first():
        raise HTTPException(status_code=404, detail="Teacher not found")

    # The uq_class_subject constraint means one teacher per subject per
    # class — friendly 409 before the DB complains.
    existing = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This subject is already assigned in this class. Remove the existing assignment first."
        )

    link = ClassSubject(
        id         = uuid.uuid4(),
        class_id   = class_id,
        subject_id = subject_id,
        teacher_id = teacher_id,
    )
    db.add(link)
    db.commit()

    return {"message": "Subject assigned", "class_id": class_id,
            "subject_id": subject_id, "teacher_id": teacher_id}


def get_class_subjects(db: Session, class_id: str):
    """A class's subject roster with the assigned teacher per subject."""
    if not db.query(Class).filter(Class.id == class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")

    rows = (
        db.query(ClassSubject, Subject, Teacher)
        .join(Subject, ClassSubject.subject_id == Subject.id)
        .join(Teacher, ClassSubject.teacher_id == Teacher.id)
        .filter(ClassSubject.class_id == class_id)
        .order_by(Subject.subject_code.asc())
        .all()
    )

    return {
        "class_id": class_id,
        "total": len(rows),
        "items": [
            {
                "assignment_id": str(cs.id),
                "subject_id": str(sub.id),
                "subject_code": sub.subject_code,
                "subject_name": sub.subject_name,
                "teacher_id": str(t.id),
                "teacher_name": f"{t.first_name} {t.last_name}",
            }
            for cs, sub, t in rows
        ],
    }


def get_teacher_classes(db: Session, teacher_id: str):
    """
    All classes a teacher is involved in: teaching assignments
    (ClassSubject) UNION homeroom duty — deduplicated by class id.
    Serves MyClassesPage and TeacherDetailPage.
    """
    if not db.query(Teacher).filter(Teacher.id == teacher_id).first():
        raise HTTPException(status_code=404, detail="Teacher not found")

    taught = (
        db.query(Class)
        .join(ClassSubject, ClassSubject.class_id == Class.id)
        .filter(ClassSubject.teacher_id == teacher_id, Class.is_active == True)
        .all()
    )
    homeroom = (
        db.query(Class)
        .filter(Class.homeroom_teacher_id == teacher_id, Class.is_active == True)
        .all()
    )

    seen, merged = set(), []
    for c in taught + homeroom:
        if c.id not in seen:
            seen.add(c.id)
            merged.append(c)

    homeroom_ids = {c.id for c in homeroom}

    return {
        "teacher_id": teacher_id,
        "total": len(merged),
        "items": [
            {
                "id": str(c.id),
                "class_name": c.class_name,
                "class_code": c.class_code,
                "department": c.department,
                "semester": c.semester,
                "academic_year": c.academic_year,
                "is_homeroom": c.id in homeroom_ids,
            }
            for c in merged
        ],
    }

def enroll_students(db: Session, class_id: str, student_ids: list):
    """
    Bulk-enrolls students into a class. Creates one Enrollment row per
    student. Idempotent-friendly: students already ACTIVE-enrolled are
    skipped (not an error) so re-submitting a roster is always safe.
    """
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if not student_ids:
        raise HTTPException(status_code=400, detail="student_ids cannot be empty")

    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    found_ids = {str(s.id) for s in students}
    missing = [sid for sid in student_ids if sid not in found_ids]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Student id(s) not found: {', '.join(missing)}"
        )

    existing_rows = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.student_id.in_(student_ids))
        .all()
    )
    existing_by_str = {str(row.student_id): row for row in existing_rows}

    enrolled, reactivated, already_active = [], [], []

    for sid in student_ids:
        row = existing_by_str.get(sid)
        if row is None:
            db.add(Enrollment(
                id         = uuid.uuid4(),
                student_id = sid,
                class_id   = class_id,
                status     = "ACTIVE",
            ))
            enrolled.append(sid)
        elif row.status != "ACTIVE":
            row.status = "ACTIVE"
            reactivated.append(sid)
        else:
            already_active.append(sid)

    db.commit()

    return {
        "class_id": class_id,
        "enrolled": enrolled,
        "reactivated": reactivated,
        "already_active": already_active,
        "message": f"{len(enrolled) + len(reactivated)} student(s) enrolled in {class_obj.class_code}",
    }


def withdraw_students(db: Session, class_id: str, student_ids: list):
    """
    Withdraws students from a class — sets Enrollment.status to
    WITHDRAWN rather than deleting the row. Soft, same reasoning as
    every other delete in this codebase: attendance/marks history for
    this student in this class must keep pointing at a real enrollment.
    """
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    rows = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.student_id.in_(student_ids))
        .all()
    )
    found_ids = {str(r.student_id) for r in rows}
    missing = [sid for sid in student_ids if sid not in found_ids]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"No active enrollment found for student id(s): {', '.join(missing)}"
        )

    for row in rows:
        row.status = "WITHDRAWN"

    db.commit()
    return {
        "class_id": class_id,
        "withdrawn": [str(r.student_id) for r in rows],
        "message": f"{len(rows)} student(s) withdrawn from {class_obj.class_code}",
    }


def get_unenrolled_students(db: Session, class_id: str, search: str = None):
    """
    Students NOT currently ACTIVE-enrolled in this class — feeds the
    enrollment panel's picker (you don't want to show already-enrolled
    students in a list meant for ADDING new ones).
    """
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    enrolled_ids = (
        db.query(Enrollment.student_id)
        .filter(Enrollment.class_id == class_id, Enrollment.status == "ACTIVE")
        .subquery()
    )

    query = db.query(Student).filter(
        Student.is_active == True,
        ~Student.id.in_(enrolled_ids),
    )
    if search:
        query = query.filter(
            or_(
                Student.first_name.ilike(f"%{search}%"),
                Student.last_name.ilike(f"%{search}%"),
                Student.student_code.ilike(f"%{search}%"),
            )
        )

    students = query.order_by(Student.student_code.asc()).limit(100).all()

    return {
        "class_id": class_id,
        "total": len(students),
        "items": [
            {
                "id": str(s.id),
                "student_code": s.student_code,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "program": s.program,
            }
            for s in students
        ],
    }