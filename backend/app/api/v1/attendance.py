from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from app.database.connection import get_db
from app.api.deps import require_role, get_current_user
from app.services.attendance_service import (
    record_attendance, get_student_attendance, get_class_attendance
)
from app.schemas.attendance import AttendanceCreate

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("")
def create_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return record_attendance(db, str(current_user.id), payload.dict())


@router.get("/student/{student_id}")
def student_attendance(
    student_id: str,
    subject_id: str = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    return get_student_attendance(
        db          = db,
        student_id  = student_id,
        subject_id  = subject_id,
        start_date  = start_date,
        end_date    = end_date,
        status      = status
    )


@router.get("/class/{class_id}")
def class_attendance(
    class_id: str,
    subject_id: str = Query(None),
    month: int = Query(None),
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    return get_class_attendance(
        db         = db,
        class_id   = class_id,
        subject_id = subject_id,
        month      = month,
        year       = year
    )