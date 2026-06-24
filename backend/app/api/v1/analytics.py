from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.analytics_service import (
    get_student_analytics, get_class_analytics,
    get_subject_analytics, get_admin_dashboard
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/student/{student_id}")
def student_analytics(
    student_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    return get_student_analytics(db, student_id)


@router.get("/class/{class_id}")
def class_analytics(
    class_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_class_analytics(db, class_id)


@router.get("/subject/{subject_id}")
def subject_analytics(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_subject_analytics(db, subject_id)


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN"))
):
    return get_admin_dashboard(db)