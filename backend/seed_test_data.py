"""
seed_test_data.py
=================
Seeds academic history for Test Student so the frontend pages have
real data to display: 1 class, 3 subjects, marks, ~8 weeks of
attendance, and 3 semesters of GPA records.

Run ONCE from the backend folder:  python seed_test_data.py
(Safe-ish to rerun: skips seeding if the student already has marks.)
"""

import uuid
import random
from datetime import date, timedelta

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.class_ import Class
from app.models.subject import Subject
from app.models.marks import Marks, GPARecord
from app.models.attendance import Attendance

db = SessionLocal()

# ── 1. Find the existing student and a user to be "recorded_by" ──────────
student = db.query(Student).filter(Student.student_code == "STU-2025-001").first()
recorder = db.query(User).filter(User.email == "teacher@spas.com").first()

if not student or not recorder:
    raise SystemExit("Student STU-2024-001 or teacher@spas.com not found — fix emails/codes at the top of this script.")

student_code = student.student_code   # capture BEFORE commit expires it

if db.query(Marks).filter(Marks.student_id == student.id).count() > 0:
    raise SystemExit("This student already has marks — refusing to double-seed.")

# ── 2. Get-or-create one class ────────────────────────────────────────────
class_obj = db.query(Class).filter(Class.class_code == "CS-3A").first()
if not class_obj:
    class_obj = Class(
        id=uuid.uuid4(), class_name="Computer Science 3A", class_code="CS-3A",
        program="Computer Science", department="Computer Science",
        semester=5, academic_year="2025-2026", is_active=True,
    )
    db.add(class_obj)
    db.flush()

# ── 3. Get-or-create three subjects ───────────────────────────────────────
subject_defs = [
    ("CS301", "Database Systems"),
    ("CS302", "Operating Systems"),
    ("CS303", "Machine Learning"),
]
subjects = []
for code, name in subject_defs:
    s = db.query(Subject).filter(Subject.subject_code == code).first()
    if not s:
        s = Subject(
            id=uuid.uuid4(), subject_code=code, subject_name=name,
            credit_hours=3, department="Computer Science", is_active=True,
        )
        db.add(s)
        db.flush()
    subjects.append(s)

# ── 4. Marks: per subject 2 quizzes, 2 assignments, 1 midterm, 1 final ───
# Different performance per subject so charts look interesting:
# CS301 strong, CS302 average, CS303 weak (will pull the radar shape).
performance = {"CS301": 0.85, "CS302": 0.68, "CS303": 0.45}

def add_mark(subject, mark_type, max_score, level):
    noise = random.uniform(-0.08, 0.08)
    score = round(max_score * min(1.0, max(0.05, level + noise)), 1)
    db.add(Marks(
        id=uuid.uuid4(), student_id=student.id, subject_id=subject.id,
        class_id=class_obj.id, mark_type=mark_type,
        score=score, max_score=max_score, recorded_by=recorder.id,
    ))

for s in subjects:
    lvl = performance[s.subject_code]
    add_mark(s, "QUIZ", 10, lvl); add_mark(s, "QUIZ", 10, lvl)
    add_mark(s, "ASSIGNMENT", 20, lvl); add_mark(s, "ASSIGNMENT", 20, lvl)
    add_mark(s, "MIDTERM", 50, lvl)
    if s.subject_code != "CS303":          # leave one final missing —
        add_mark(s, "FINAL", 100, lvl)     # tests the null-final display path

# ── 5. Attendance: ~8 weeks of weekdays, one subject per weekday slot ────
# Weak subject also gets weak attendance, so the story is consistent.
attend_rate = {"CS301": 0.92, "CS302": 0.80, "CS303": 0.55}
d = date.today() - timedelta(days=56)
while d <= date.today():
    if d.weekday() < 5:                        # Mon–Fri only
        subj = subjects[d.weekday() % 3]       # rotate subjects across days
        r = random.random()
        rate = attend_rate[subj.subject_code]
        status = "PRESENT" if r < rate else ("LATE" if r < rate + 0.1 else "ABSENT")
        db.add(Attendance(
            id=uuid.uuid4(), student_id=student.id, class_id=class_obj.id,
            subject_id=subj.id, attendance_date=d, status=status,
            recorded_by=recorder.id,
        ))
    d += timedelta(days=1)

# ── 6. GPA records: three semesters showing a gentle decline ─────────────
gpa_rows = [
    ("Fall",   "2024-25", 3.10, 3.10),
    ("Spring", "2025",    2.85, 2.98),
    ("Fall",   "2025-26", 2.60, 2.85),
]
for sem, year, gpa, cgpa in gpa_rows:
    db.add(GPARecord(
        id=uuid.uuid4(), student_id=student.id,
        semester=sem, academic_year=year, gpa=gpa, cgpa=cgpa,
    ))

db.commit()
db.close()
print("Seeded: 1 class, 3 subjects, marks, ~40 attendance days, 3 GPA records for", student_code)
