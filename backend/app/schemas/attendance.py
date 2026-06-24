from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date


class AttendanceRecordItem(BaseModel):
    student_id: str
    status: str   # PRESENT, ABSENT, LATE

    @validator('status')
    def validate_status(cls, v):
        if v not in ("PRESENT", "ABSENT", "LATE"):
            raise ValueError('Status must be PRESENT, ABSENT, or LATE')
        return v


class AttendanceCreate(BaseModel):
    class_id: str
    subject_id: str
    attendance_date: date
    records: List[AttendanceRecordItem]

    @validator('attendance_date')
    def date_not_in_future(cls, v):
        if v > date.today():
            raise ValueError('Attendance date cannot be in the future')
        return v


class AttendanceSubjectSummary(BaseModel):
    subject_code: str
    percentage: float
    status: str   # e.g. WARNING, OK


class AttendanceSummary(BaseModel):
    total_days: int
    present: int
    absent: int
    late: int
    overall_percentage: float
    by_subject: List[AttendanceSubjectSummary]


class AttendanceHistoryResponse(BaseModel):
    student_id: str
    records: List[dict]
    summary: AttendanceSummary