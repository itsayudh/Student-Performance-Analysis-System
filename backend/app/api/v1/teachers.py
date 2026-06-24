from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.teacher_service import (
    get_teachers, get_teacher_by_id, create_teacher,
    update_teacher, delete_teacher
)
from app.schemas.teacher import TeacherCreate, TeacherUpdate

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("")
def list_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    result = get_teachers(
        db         = db,
        page       = page,
        page_size  = page_size,
        search     = search,
        department = department
    )
    return result


@router.get("/{teacher_id}")
def get_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    teacher = get_teacher_by_id(db, teacher_id)
    return teacher


@router.post("")
def add_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return create_teacher(db, payload.dict())


@router.put("/{teacher_id}")
def edit_teacher(
    teacher_id: str,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return update_teacher(db, teacher_id, payload.dict(exclude_unset=True))


@router.delete("/{teacher_id}")
def remove_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return delete_teacher(db, teacher_id)