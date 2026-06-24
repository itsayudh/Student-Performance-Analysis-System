from pydantic import BaseModel
from typing import List, Optional


class GPATrendItem(BaseModel):
    semester: str
    gpa: float


class AttendanceTrendItem(BaseModel):
    week: str
    percentage: float


class SubjectPerformanceItem(BaseModel):
    subject: str
    score: float
    class_avg: float
    rank: Optional[int] = None


class RiskAssessment(BaseModel):
    risk_level: str
    failure_probability: float
    at_risk_subjects: List[str] = []


class StudentAnalyticsResponse(BaseModel):
    student_id: str
    current_gpa: float
    cgpa: float
    gpa_trend: List[GPATrendItem]
    attendance_trend: List[AttendanceTrendItem]
    subject_performance: List[SubjectPerformanceItem]
    risk_assessment: RiskAssessment


class GradeDistribution(BaseModel):
    A: int = 0
    B: int = 0
    C: int = 0
    D: int = 0
    F: int = 0


class ClassAnalyticsResponse(BaseModel):
    class_id: str
    class_name: str
    student_count: int
    class_gpa_avg: float
    grade_distribution: GradeDistribution
    attendance_rate: float
    at_risk_count: int


class SubjectAnalyticsResponse(BaseModel):
    subject_id: str
    subject_name: str
    subject_code: str
    enrolled_count: int
    class_average: float
    pass_rate: float
    grade_distribution: GradeDistribution
    attendance_avg: float
    difficulty_score: float


class DepartmentPerformanceItem(BaseModel):
    department: str
    avg_gpa: float
    student_count: int


class DashboardResponse(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    overall_gpa_avg: float
    overall_attendance_rate: float
    at_risk_students: int
    pass_rate_this_semester: float
    recent_alerts: int
    department_performance: List[DepartmentPerformanceItem]