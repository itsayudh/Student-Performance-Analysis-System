import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

import secrets

from app.models.teacher import Teacher
from app.models.user import User
from app.utils.security import hash_password
from app.utils.email import send_temporary_password_email


def get_teachers(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: str = None,
    department: str = None
):
    query = db.query(Teacher)

    if search:
        query = query.filter(
            or_(
                Teacher.first_name.ilike(f"%{search}%"),
                Teacher.last_name.ilike(f"%{search}%"),
                Teacher.employee_code.ilike(f"%{search}%"),
            )
        )

    if department:
        query = query.filter(Teacher.department == department)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


def get_teacher_by_id(db: Session, teacher_id: str):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


def create_teacher(db: Session, data: dict):
    existing_code = db.query(Teacher).filter(
        Teacher.employee_code == data["employee_code"]
    ).first()
    existing_email = db.query(User).filter(
        User.email == data["email"]
    ).first()

    if existing_code or existing_email:
        raise HTTPException(
            status_code=409,
            detail="Teacher with this code or email already exists"
        )

    temp_password = secrets.token_urlsafe(8)

    user = User(
        id            = uuid.uuid4(),
        email         = data["email"],
        password_hash = hash_password(temp_password),
        role          = "TEACHER",
        is_active     = True,
    )
    db.add(user)
    db.flush()

    teacher = Teacher(
        id              = uuid.uuid4(),
        user_id         = user.id,
        employee_code   = data["employee_code"],
        first_name      = data["first_name"],
        last_name       = data["last_name"],
        department      = data["department"],
        specialization  = data.get("specialization"),
        qualification   = data.get("qualification"),
        joining_date    = data["joining_date"],
        is_active       = True,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    # Fire the welcome/temp-password email. Failure here must NOT roll
    # back the student creation — the account already exists and is
    # usable; email is a delivery convenience, not a transaction
    # requirement. We surface success/failure in the response instead
    # of silently claiming it worked either way.
    email_sent = send_temporary_password_email(
        to_email      = data["email"],
        full_name     = f"{data['first_name']} {data['last_name']}",
        temp_password = temp_password,
        role          = "TEACHER",
    )

    return {
        "id": str(teacher.id),
        "employee_code": teacher.employee_code,
        "message": (
            f"Teacher created. Temporary password emailed to {data['email']}."
            if email_sent else
            f"Teacher created, but the welcome email could not be sent. "
            f"Share the temporary password with the teacher directly."
        ),
        "email_sent": email_sent,
        "temp_password": temp_password   # remove in production — email it instead
    }


def update_teacher(db: Session, teacher_id: str, data: dict):
    teacher = get_teacher_by_id(db, teacher_id)

    for field, value in data.items():
        if value is not None:
            setattr(teacher, field, value)

    db.commit()
    db.refresh(teacher)
    return {"id": str(teacher.id), "message": "Teacher updated successfully"}


def delete_teacher(db: Session, teacher_id: str):
    teacher = get_teacher_by_id(db, teacher_id)
    teacher.is_active = False

    user = db.query(User).filter(User.id == teacher.user_id).first()
    if user:
        user.is_active = False

    db.commit()
    return {"message": "Teacher deactivated."}