import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.student import Student
from app.models.user import User
from app.utils.security import hash_password


def get_students(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: str = None,
    department: str = None,
    is_active: bool = None
):
    query = db.query(Student)

    if search:
        query = query.filter(
            or_(
                Student.first_name.ilike(f"%{search}%"),
                Student.last_name.ilike(f"%{search}%"),
                Student.student_code.ilike(f"%{search}%"),
            )
        )

    if department:
        query = query.filter(Student.department == department)

    if is_active is not None:
        query = query.filter(Student.is_active == is_active)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


def get_student_by_id(db: Session, student_id: str):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def create_student(db: Session, data: dict):
    existing_code = db.query(Student).filter(
        Student.student_code == data["student_code"]
    ).first()
    existing_email = db.query(User).filter(
        User.email == data["email"]
    ).first()

    if existing_code or existing_email:
        raise HTTPException(
            status_code=409,
            detail="Student with this code or email already exists"
        )

    temp_password = str(uuid.uuid4())[:10]

    user = User(
        id            = uuid.uuid4(),
        email         = data["email"],
        password_hash = hash_password(temp_password),
        role          = "STUDENT",
        is_active     = True,
    )
    db.add(user)
    db.flush()

    student = Student(
        id             = uuid.uuid4(),
        user_id        = user.id,
        student_code   = data["student_code"],
        first_name     = data["first_name"],
        last_name      = data["last_name"],
        gender         = data.get("gender"),
        date_of_birth  = data.get("date_of_birth"),
        phone          = data.get("phone"),
        address        = data.get("address"),
        program        = data["program"],
        department     = data["department"],
        admission_date = data["admission_date"],
        is_active      = True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "id": str(student.id),
        "student_code": student.student_code,
        "message": f"Student created. Temporary password sent to {data['email']}",
        "temp_password": temp_password   # remove in production — email it instead
    }


def update_student(db: Session, student_id: str, data: dict):
    student = get_student_by_id(db, student_id)

    for field, value in data.items():
        if value is not None:
            setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return {"id": str(student.id), "message": "Student updated successfully"}


def delete_student(db: Session, student_id: str):
    student = get_student_by_id(db, student_id)
    student.is_active = False

    user = db.query(User).filter(User.id == student.user_id).first()
    if user:
        user.is_active = False

    db.commit()
    return {"message": "Student deactivated. Historical records preserved."}