# app/schemas/subject.py
#
# First write-side schemas for subjects — subject_service.py has been
# read-only since it was added (see its module docstring). The catalog
# was seed-only until now; this unblocks admin-created subjects instead
# of requiring a direct DB insert.

from pydantic import BaseModel, validator
from typing import Optional


class SubjectCreate(BaseModel):
    subject_name: str
    subject_code: str
    department: str
    credit_hours: int = 3

    @validator('subject_name', 'subject_code', 'department')
    def not_blank(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    @validator('credit_hours')
    def credit_hours_range(cls, v):
        if v < 1 or v > 10:
            raise ValueError('Credit hours must be between 1 and 10')
        return v


class SubjectUpdate(BaseModel):
    # subject_code deliberately NOT updatable — same reasoning as
    # ClassUpdate/StudentUpdate: it's the external identifier other
    # records (ClassSubject, Attendance, Marks) reference by meaning.
    subject_name: Optional[str] = None
    department: Optional[str] = None
    credit_hours: Optional[int] = None

    @validator('credit_hours')
    def credit_hours_range(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError('Credit hours must be between 1 and 10')
        return v