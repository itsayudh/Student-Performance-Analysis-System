from pydantic import BaseModel, validator
from typing import Optional, List


class MarksRecordItem(BaseModel):
    student_id: str
    score: float

    @validator('score')
    def score_non_negative(cls, v):
        if v < 0:
            raise ValueError('Score cannot be negative')
        return v


class MarksCreate(BaseModel):
    class_id: str
    subject_id: str
    mark_type: str   # QUIZ, ASSIGNMENT, MIDTERM, FINAL
    max_score: float
    records: List[MarksRecordItem]

    @validator('mark_type')
    def validate_mark_type(cls, v):
        if v not in ("QUIZ", "ASSIGNMENT", "MIDTERM", "FINAL"):
            raise ValueError('mark_type must be QUIZ, ASSIGNMENT, MIDTERM, or FINAL')
        return v

    @validator('max_score')
    def max_score_positive(cls, v):
        if v <= 0:
            raise ValueError('max_score must be greater than 0')
        return v

    @validator('records')
    def scores_within_max(cls, v, values):
        max_score = values.get('max_score')
        if max_score:
            for record in v:
                if record.score > max_score:
                    raise ValueError(
                        f"Score {record.score} exceeds max_score {max_score} for student {record.student_id}"
                    )
        return v


class MarksUpdate(BaseModel):
    score: float
    update_reason: Optional[str] = None


class MarksSubjectBreakdown(BaseModel):
    subject_code: str
    subject_name: str
    quiz: List[dict] = []
    assignment: List[dict] = []
    midterm: Optional[dict] = None
    final: Optional[dict] = None
    current_percentage: float
    current_grade: str


class MarksStudentResponse(BaseModel):
    student_id: str
    marks: List[MarksSubjectBreakdown]