from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.student_service import (
    get_students, get_student_by_id, create_student,
    update_student, delete_student
)
from app.schemas.student import StudentCreate, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("")
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    result = get_students(
        db          = db,
        page        = page,
        page_size   = page_size,
        search      = search,
        department  = department,
        is_active   = is_active
    )
    return result


@router.get("/{student_id}")
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    student = get_student_by_id(db, student_id)
    return student


@router.post("")
def add_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return create_student(db, payload.dict())


@router.put("/{student_id}")
def edit_student(
    student_id: str,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return update_student(db, student_id, payload.dict(exclude_unset=True))


@router.delete("/{student_id}")
def remove_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return delete_student(db, student_id)