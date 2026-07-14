# delete_teachers.py — run from the backend folder: python delete_teachers.py
from app.database.connection import SessionLocal
from app.models.user import User
from app.models.teacher import Teacher
from app.models.class_ import Class, ClassSubject
from app.models.marks import Marks
from app.models.attendance import Attendance

EMPLOYEE_CODES = ["TCH-002"]

db = SessionLocal()

admin_user = db.query(User).filter(User.role == "ADMIN").first()
if not admin_user:
    raise SystemExit("No ADMIN user found to reassign records to — aborting.")

targets = []  # (teacher, user) pairs actually found

for code in EMPLOYEE_CODES:
    teacher = db.query(Teacher).filter(Teacher.employee_code == code).first()
    if not teacher:
        print(f"⚠ No teacher found with employee_code '{code}' — skipping.")
        continue
    user = db.query(User).filter(User.id == teacher.user_id).first()
    if not user:
        print(f"⚠ Teacher '{code}' has no linked user account — skipping (nothing to free up).")
        continue
    targets.append((teacher, user))

if not targets:
    raise SystemExit("Nothing found to delete.")

# Preview everything before touching anything.
print("\n--- Preview ---")
for teacher, user in targets:
    marks_count = db.query(Marks).filter(Marks.recorded_by == user.id).count()
    attendance_count = db.query(Attendance).filter(Attendance.recorded_by == user.id).count()
    assignment_count = db.query(ClassSubject).filter(ClassSubject.teacher_id == teacher.id).count()
    homeroom_count = db.query(Class).filter(Class.homeroom_teacher_id == teacher.id).count()
    print(f"\n{teacher.employee_code} — {user.email} ({teacher.first_name} {teacher.last_name})")
    print(f"  Marks recorded:        {marks_count}  (reassigned to admin, NOT deleted)")
    print(f"  Attendance recorded:   {attendance_count}  (reassigned to admin, NOT deleted)")
    print(f"  Subject assignments:   {assignment_count}  (deleted)")
    print(f"  Homeroom classes:      {homeroom_count}  (homeroom cleared, class stays)")

confirm = input(f"\nType 'yes' to delete all {len(targets)} teacher(s) above: ")
if confirm.strip().lower() != "yes":
    raise SystemExit("Cancelled — nothing was changed.")

for teacher, user in targets:
    db.query(Marks).filter(Marks.recorded_by == user.id).update({"recorded_by": admin_user.id})
    db.query(Attendance).filter(Attendance.recorded_by == user.id).update({"recorded_by": admin_user.id})
    db.query(Class).filter(Class.homeroom_teacher_id == teacher.id).update({"homeroom_teacher_id": None})
    db.query(ClassSubject).filter(ClassSubject.teacher_id == teacher.id).delete()
    db.delete(teacher)
    db.delete(user)
    print(f"Deleted {teacher.employee_code} ({user.email})")

db.commit()
print("\nDone. Both emails are now free to reuse.")
db.close()