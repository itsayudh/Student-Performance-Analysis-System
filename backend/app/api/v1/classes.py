from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.class_service import get_classes, get_class_by_id

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