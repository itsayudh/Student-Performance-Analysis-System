from pydantic import BaseModel, validator
from typing import Optional


class ClassCreate(BaseModel):
    class_name: str
    class_code: str
    program: str
    department: str
    semester: int
    academic_year: str
    homeroom_teacher_id: Optional[str] = None   # a class can exist before
                                                # a homeroom teacher is chosen

    @validator('class_name', 'class_code', 'program', 'department')
    def not_blank(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    @validator('semester')
    def semester_range(cls, v):
        if v < 1 or v > 12:
            raise ValueError('Semester must be between 1 and 12')
        return v


class ClassUpdate(BaseModel):
    # Every field optional: PUT sends only what changed (exclude_unset
    # in the router strips the rest) — same partial-update contract as
    # StudentUpdate/TeacherUpdate.
    class_name: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    homeroom_teacher_id: Optional[str] = None
    # class_code deliberately NOT updatable: it's the unique external
    # identifier other records reference by meaning — renaming a class
    # is fine, re-coding it invites confusion. (Same reason StudentUpdate
    # doesn't allow changing student_code.)

class ClassSubjectAssign(BaseModel):
    subject_id: str
    teacher_id: str