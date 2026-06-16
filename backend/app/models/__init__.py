from app.models.user           import User, TokenBlacklist
from app.models.teacher        import Teacher
from app.models.student        import Student
from app.models.subject        import Subject
from app.models.class_         import Class, ClassSubject
from app.models.enrollment     import Enrollment
from app.models.attendance     import Attendance
from app.models.marks          import Marks, GPARecord
from app.models.prediction     import Prediction
from app.models.recommendation import Recommendation
from app.models.notification   import Notification
from app.models.report         import Report

__all__ = [
    "User", "TokenBlacklist",
    "Teacher",
    "Student",
    "Subject",
    "Class", "ClassSubject",
    "Enrollment",
    "Attendance",
    "Marks", "GPARecord",
    "Prediction",
    "Recommendation",
    "Notification",
    "Report",
]