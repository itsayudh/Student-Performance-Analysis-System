# app/schemas/enrollment.py
#
# Schemas for the enrollment write endpoints. The Enrollment MODEL has
# existed since early in the project (student_id + class_id, unique
# constraint, status column) — these are the first schemas to expose it
# through the API. Mirrors the shape of ClassSubjectAssign in class_.py.

from pydantic import BaseModel
from typing import List


class EnrollmentCreate(BaseModel):
    # Bulk by design: admin enrolls a whole class roster in one action,
    # not one student at a time. A single-student enroll is just a
    # list of length 1 — no separate schema needed.
    student_ids: List[str]


class EnrollmentWithdraw(BaseModel):
    # Symmetric bulk shape for withdrawal, same reasoning.
    student_ids: List[str]