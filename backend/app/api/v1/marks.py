from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.marks_service import (
    record_marks, get_student_marks, update_mark
)
from app.schemas.marks import MarksCreate, MarksUpdate

router = APIRouter(prefix="/marks", tags=["Marks"])


@router.post("")
def create_marks(
    payload: MarksCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return record_marks(db, str(current_user.id), payload.dict())


@router.get("/student/{student_id}")
def student_marks(
    student_id: str,
    subject_id: str = Query(None),
    mark_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    return get_student_marks(
        db         = db,
        student_id = student_id,
        subject_id = subject_id,
        mark_type  = mark_type
    )


@router.put("/{mark_id}")
def edit_mark(
    mark_id: str,
    payload: MarksUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return update_mark(db, mark_id, payload.score, payload.update_reason)