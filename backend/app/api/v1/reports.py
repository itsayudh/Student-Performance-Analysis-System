from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import require_role
from app.services.report_service import (
    generate_student_report, generate_class_report, generate_semester_report
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate")
def generate_report(
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("ADMIN", "TEACHER", "STUDENT"))
):
    report_type = payload.get("report_type")

    if report_type == "STUDENT":
        student_id = payload.get("student_id")
        semester   = payload.get("semester")
        buffer = generate_student_report(db, student_id, str(current_user.id), semester)
        filename = f"student_report_{student_id}.pdf"

    elif report_type == "CLASS":
        class_id = payload.get("class_id")
        buffer = generate_class_report(db, class_id, str(current_user.id))
        filename = f"class_report_{class_id}.pdf"

    elif report_type == "SEMESTER":
        semester = payload.get("semester")
        buffer = generate_semester_report(db, semester, str(current_user.id))
        filename = f"semester_report_{semester}.pdf"

    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Invalid report_type. Use STUDENT, CLASS, or SEMESTER")

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )