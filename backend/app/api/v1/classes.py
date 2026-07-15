from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.class_service import (
    get_classes, get_class_by_id, get_class_students,
    create_class, update_class, delete_class, get_class_subjects, assign_subject_to_class,
    enroll_students, withdraw_students, get_unenrolled_students
)
from app.schemas.class_ import ClassCreate, ClassUpdate, ClassSubjectAssign
from app.schemas.enrollment import EnrollmentCreate, EnrollmentWithdraw



router = APIRouter(prefix="/classes", tags=["Classes"])


@router.get("")
def list_classes(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    academic_year: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    # ADMIN + TEACHER, matching /students: teachers need class lists
    # for their own pages (MyClassesPage, attendance entry).
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_classes(
        db            = db,
        page          = page,
        page_size     = page_size,
        search        = search,
        department    = department,
        academic_year = academic_year,
        is_active     = is_active
    )


@router.get("/{class_id}")
def get_class(
    class_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_class_by_id(db, class_id)

@router.get("/{class_id}/students")
def class_students(
    class_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_class_students(db, class_id)

@router.post("")
def add_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return create_class(db, payload.dict())


@router.put("/{class_id}")
def edit_class(
    class_id: str,
    payload: ClassUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return update_class(db, class_id, payload.dict(exclude_unset=True))


@router.delete("/{class_id}")
def remove_class(
    class_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return delete_class(db, class_id)

@router.post("/{class_id}/subjects")
def add_class_subject(
    class_id: str,
    payload: ClassSubjectAssign,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return assign_subject_to_class(db, class_id, payload.subject_id, payload.teacher_id)


@router.get("/{class_id}/subjects")
def class_subjects(
    class_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_class_subjects(db, class_id)

@router.post("/{class_id}/students")
def enroll_class_students(
    class_id: str,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return enroll_students(db, class_id, payload.student_ids)


@router.delete("/{class_id}/students")
def withdraw_class_students(
    class_id: str,
    payload: EnrollmentWithdraw,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return withdraw_students(db, class_id, payload.student_ids)


@router.get("/{class_id}/available-students")
def unenrolled_students(
    class_id: str,
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return get_unenrolled_students(db, class_id, search)