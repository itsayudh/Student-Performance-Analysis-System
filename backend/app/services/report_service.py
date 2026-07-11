import os
import uuid
from datetime import datetime
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.student import Student
from app.models.class_ import Class
from app.models.marks import GPARecord
from app.models.prediction import Prediction
from app.models.recommendation import Recommendation
from app.models.attendance import Attendance
from app.models.report import Report
import matplotlib
matplotlib.use("Agg")   # headless backend — MUST be set before pyplot import;
                        # without it matplotlib tries to open a GUI window
                        # inside the server process and crashes
import matplotlib.pyplot as plt
from reportlab.platypus import Image


def _gpa_trend_chart(gpa_records) -> BytesIO:
    """
    Renders the GPA trend as a PNG in memory for embedding in the PDF.
    Returns None with fewer than 2 records — a one-point 'trend' is
    meaningless and a blank chart looks broken.
    """
    if len(gpa_records) < 2:
        return None

    labels = [f"{r.semester}\n{r.academic_year}" for r in gpa_records]
    values = [r.gpa for r in gpa_records]

    fig, ax = plt.subplots(figsize=(6.2, 2.4))
    ax.plot(labels, values, marker="o", color="#4C5FD5", linewidth=2)
    ax.set_ylim(0, 4)                    # honest axis, same rule as the
    ax.set_ylabel("GPA", fontsize=9)     # frontend LineChart's yDomain
    ax.grid(True, alpha=0.3)
    ax.tick_params(labelsize=8)
    fig.tight_layout()

    img = BytesIO()
    fig.savefig(img, format="png", dpi=150)
    plt.close(fig)   # CRITICAL: without this, every report generation
                     # leaks a figure and server memory slowly grows
    img.seek(0)
    return img



def generate_student_report(db: Session, student_id: str, generated_by: str, semester: str = None) -> BytesIO:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], fontSize=18)
    elements.append(Paragraph("Student Performance Report", title_style))
    elements.append(Spacer(1, 0.5*cm))

    info_data = [
        ["Student Name", f"{student.first_name} {student.last_name}"],
        ["Student Code", student.student_code],
        ["Program", student.program],
        ["Department", student.department],
        ["Generated On", datetime.now().strftime("%Y-%m-%d %H:%M")],
    ]
    info_table = Table(info_data, colWidths=[6*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#333333")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.7*cm))

    gpa_record = db.query(GPARecord).filter(
        GPARecord.student_id == student_id
    ).order_by(GPARecord.calculated_at.desc()).first()

    gpa_series = db.query(GPARecord).filter(
        GPARecord.student_id == student_id
    ).order_by(GPARecord.calculated_at.asc()).all()

    elements.append(Paragraph("Academic Summary", styles["Heading2"]))
    gpa_data = [
        ["Current GPA", str(gpa_record.gpa) if gpa_record else "N/A"],
        ["CGPA", str(gpa_record.cgpa) if gpa_record else "N/A"],
    ]
    gpa_table = Table(gpa_data, colWidths=[6*cm, 10*cm])
    gpa_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ]))
    elements.append(gpa_table)
    elements.append(Spacer(1, 0.7*cm))

    chart_img = _gpa_trend_chart(gpa_series)
    if chart_img:
        elements.append(Paragraph("GPA Trend", styles["Heading2"]))
        elements.append(Image(chart_img, width=16*cm, height=6*cm))
        elements.append(Spacer(1, 0.7*cm))

    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total_att = len(attendance_records)
    present_att = sum(1 for r in attendance_records if r.status == "PRESENT")
    att_pct = round((present_att / total_att * 100), 2) if total_att > 0 else 0.0

    elements.append(Paragraph("Attendance Summary", styles["Heading2"]))
    elements.append(Paragraph(f"Overall Attendance: {att_pct}%", styles["Normal"]))
    elements.append(Spacer(1, 0.7*cm))

    prediction = db.query(Prediction).filter(
        Prediction.student_id == student_id
    ).order_by(Prediction.predicted_at.desc()).first()

    elements.append(Paragraph("ML Prediction & Risk Assessment", styles["Heading2"]))
    if prediction:
        pred_data = [
            ["Predicted Grade", prediction.predicted_grade or "N/A"],
            ["Predicted Score", str(prediction.predicted_score) if prediction.predicted_score else "N/A"],
            ["Failure Probability", f"{prediction.failure_probability * 100:.1f}%"],
            ["Risk Level", prediction.risk_level],
        ]
        pred_table = Table(pred_data, colWidths=[6*cm, 10*cm])
        pred_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ]))
        elements.append(pred_table)
    else:
        elements.append(Paragraph("No prediction available yet.", styles["Normal"]))
    elements.append(Spacer(1, 0.7*cm))

    recommendations = db.query(Recommendation).filter(
        Recommendation.student_id == student_id
    ).order_by(Recommendation.created_at.desc()).limit(5).all()

    elements.append(Paragraph("Personalized Recommendations", styles["Heading2"]))
    if recommendations:
        for rec in recommendations:
            elements.append(Paragraph(f"[{rec.priority}] {rec.message}", styles["Normal"]))
            elements.append(Spacer(1, 0.2*cm))
    else:
        elements.append(Paragraph("No recommendations available yet.", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    report_record = Report(
        id           = uuid.uuid4(),
        generated_by = generated_by,
        report_type  = "STUDENT",
        parameters   = {"student_id": student_id, "semester": semester},
        file_path    = None,
    )
    db.add(report_record)
    db.commit()

    return buffer


def generate_class_report(db: Session, class_id: str, generated_by: str) -> BytesIO:
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Class Report — {class_obj.class_name}", styles["Title"]))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph(f"Academic Year: {class_obj.academic_year}", styles["Normal"]))
    elements.append(Paragraph(f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    report_record = Report(
        id           = uuid.uuid4(),
        generated_by = generated_by,
        report_type  = "CLASS",
        parameters   = {"class_id": class_id},
        file_path    = None,
    )
    db.add(report_record)
    db.commit()

    return buffer


def generate_semester_report(db: Session, semester: str, generated_by: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Semester Report — {semester}", styles["Title"]))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph(f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    report_record = Report(
        id           = uuid.uuid4(),
        generated_by = generated_by,
        report_type  = "SEMESTER",
        parameters   = {"semester": semester},
        file_path    = None,
    )
    db.add(report_record)
    db.commit()

    return buffer