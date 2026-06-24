from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from io import BytesIO

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.import_service import import_attendance, import_marks

router = APIRouter(prefix="/imports", tags=["Excel Import"])


@router.post("/attendance")
async def upload_attendance_excel(
    class_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    contents = await file.read()
    return import_attendance(db, BytesIO(contents), str(current_user.id), class_id)


@router.post("/marks")
async def upload_marks_excel(
    class_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER"))
):
    contents = await file.read()
    return import_marks(db, BytesIO(contents), str(current_user.id), class_id)