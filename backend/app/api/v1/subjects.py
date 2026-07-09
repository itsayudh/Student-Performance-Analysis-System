from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.subject_service import get_subjects, get_subject_by_id

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("")
def list_subjects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    # STUDENT included: students legitimately see subject names/codes
    # (their own marks and attendance pages reference subjects).
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    return get_subjects(
        db         = db,
        page       = page,
        page_size  = page_size,
        search     = search,
        department = department,
        is_active  = is_active
    )


@router.get("/{subject_id}")
def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    return get_subject_by_id(db, subject_id)