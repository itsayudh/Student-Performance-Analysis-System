from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.student import Student
from app.models.teacher import Teacher
from app.models.class_ import Class
from app.models.subject import Subject
from app.models.marks import Marks, GPARecord
from app.models.attendance import Attendance
from app.models.prediction import Prediction
from app.models.notification import Notification
from app.utils.gpa_calculator import score_to_letter_grade


def get_student_analytics(db: Session, student_id: str):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    gpa_records = db.query(GPARecord).filter(
        GPARecord.student_id == student_id
    ).order_by(GPARecord.calculated_at.asc()).all()

    current_gpa = gpa_records[-1].gpa if gpa_records else 0.0
    cgpa         = gpa_records[-1].cgpa if gpa_records else 0.0

    gpa_trend = [
        {"semester": f"{r.semester} {r.academic_year}", "gpa": r.gpa}
        for r in gpa_records
    ]

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()

    total_att = len(attendance_records)
    present_att = sum(1 for r in attendance_records if r.status == "PRESENT")
    overall_att_pct = round((present_att / total_att * 100), 2) if total_att > 0 else 0.0

    attendance_trend = [
        {"week": "Current", "percentage": overall_att_pct}
    ]

    marks_records = db.query(Marks).filter(Marks.student_id == student_id).all()
    subject_scores = {}
    for m in marks_records:
        sid = str(m.subject_id)
        pct = (m.score / m.max_score * 100) if m.max_score > 0 else 0.0
        subject_scores.setdefault(sid, []).append(pct)

    subject_performance = []
    for sid, scores in subject_scores.items():
        avg_score = round(sum(scores) / len(scores), 2)
        subject_performance.append({
            "subject": sid,
            "score": avg_score,
            "class_avg": avg_score,
            "rank": None
        })

    latest_prediction = db.query(Prediction).filter(
        Prediction.student_id == student_id
    ).order_by(Prediction.predicted_at.desc()).first()

    risk_assessment = {
        "risk_level": latest_prediction.risk_level if latest_prediction else "LOW",
        "failure_probability": latest_prediction.failure_probability if latest_prediction else 0.0,
        "at_risk_subjects": []
    }

    return {
        "student_id": student_id,
        "current_gpa": current_gpa,
        "cgpa": cgpa,
        "gpa_trend": gpa_trend,
        "attendance_trend": attendance_trend,
        "subject_performance": subject_performance,
        "risk_assessment": risk_assessment
    }


def get_class_analytics(db: Session, class_id: str):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    marks_records = db.query(Marks).filter(Marks.class_id == class_id).all()

    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    all_scores = []

    for m in marks_records:
        pct = (m.score / m.max_score * 100) if m.max_score > 0 else 0.0
        all_scores.append(pct)
        grade = score_to_letter_grade(pct)
        grade_key = grade[0]   # first letter, since A+ -> A bucket
        if grade_key in grade_dist:
            grade_dist[grade_key] += 1

    class_gpa_avg = round(sum(all_scores) / len(all_scores) / 25, 2) if all_scores else 0.0

    attendance_records = db.query(Attendance).filter(Attendance.class_id == class_id).all()
    total_att = len(attendance_records)
    present_att = sum(1 for r in attendance_records if r.status == "PRESENT")
    attendance_rate = round((present_att / total_att * 100), 2) if total_att > 0 else 0.0

    at_risk_count = db.query(Prediction).join(
        Student, Prediction.student_id == Student.id
    ).filter(
        Prediction.risk_level.in_(["HIGH", "CRITICAL"])
    ).count()

    student_count = db.query(Student).filter(Student.is_active == True).count()

    return {
        "class_id": class_id,
        "class_name": class_obj.class_name,
        "student_count": student_count,
        "class_gpa_avg": class_gpa_avg,
        "grade_distribution": grade_dist,
        "attendance_rate": attendance_rate,
        "at_risk_count": at_risk_count
    }


def get_subject_analytics(db: Session, subject_id: str):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    marks_records = db.query(Marks).filter(Marks.subject_id == subject_id).all()

    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    all_scores = []
    pass_count = 0

    for m in marks_records:
        pct = (m.score / m.max_score * 100) if m.max_score > 0 else 0.0
        all_scores.append(pct)
        if pct >= 60:
            pass_count += 1
        grade = score_to_letter_grade(pct)
        grade_key = grade[0]
        if grade_key in grade_dist:
            grade_dist[grade_key] += 1

    class_average = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0
    pass_rate = round((pass_count / len(all_scores) * 100), 2) if all_scores else 0.0

    attendance_records = db.query(Attendance).filter(Attendance.subject_id == subject_id).all()
    total_att = len(attendance_records)
    present_att = sum(1 for r in attendance_records if r.status == "PRESENT")
    attendance_avg = round((present_att / total_att * 100), 2) if total_att > 0 else 0.0

    enrolled_count = len(set(m.student_id for m in marks_records))
    difficulty_score = round(1 - (class_average / 100), 2) if class_average else 0.0

    return {
        "subject_id": subject_id,
        "subject_name": subject.subject_name,
        "subject_code": subject.subject_code,
        "enrolled_count": enrolled_count,
        "class_average": class_average,
        "pass_rate": pass_rate,
        "grade_distribution": grade_dist,
        "attendance_avg": attendance_avg,
        "difficulty_score": difficulty_score
    }


def get_admin_dashboard(db: Session):
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_teachers = db.query(Teacher).filter(Teacher.is_active == True).count()
    total_classes  = db.query(Class).filter(Class.is_active == True).count()

    gpa_records = db.query(GPARecord).all()
    overall_gpa_avg = round(
        sum(r.gpa for r in gpa_records) / len(gpa_records), 2
    ) if gpa_records else 0.0

    attendance_records = db.query(Attendance).all()
    total_att = len(attendance_records)
    present_att = sum(1 for r in attendance_records if r.status == "PRESENT")
    overall_attendance_rate = round((present_att / total_att * 100), 2) if total_att > 0 else 0.0

    at_risk_students = db.query(Prediction).filter(
        Prediction.risk_level.in_(["HIGH", "CRITICAL"])
    ).count()

    marks_records = db.query(Marks).filter(Marks.mark_type == "FINAL").all()
    pass_count = sum(
        1 for m in marks_records
        if m.max_score > 0 and (m.score / m.max_score * 100) >= 60
    )
    pass_rate_this_semester = round(
        (pass_count / len(marks_records) * 100), 2
    ) if marks_records else 0.0

    recent_alerts = db.query(Notification).filter(
        Notification.is_resolved == False
    ).count()

    departments = db.query(Student.department).distinct().all()
    department_performance = []
    for (dept,) in departments:
        dept_students = db.query(Student).filter(Student.department == dept).all()
        student_ids = [s.id for s in dept_students]
        dept_gpa_records = db.query(GPARecord).filter(
            GPARecord.student_id.in_(student_ids)
        ).all()
        avg_gpa = round(
            sum(r.gpa for r in dept_gpa_records) / len(dept_gpa_records), 2
        ) if dept_gpa_records else 0.0

        department_performance.append({
            "department": dept,
            "avg_gpa": avg_gpa,
            "student_count": len(dept_students)
        })

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_classes": total_classes,
        "overall_gpa_avg": overall_gpa_avg,
        "overall_attendance_rate": overall_attendance_rate,
        "at_risk_students": at_risk_students,
        "pass_rate_this_semester": pass_rate_this_semester,
        "recent_alerts": recent_alerts,
        "department_performance": department_performance
    }