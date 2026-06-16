from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

revision  = "001"
down_revision = None
branch_labels = None
depends_on    = None


def upgrade() -> None:

    # 1. users
    op.create_table(
        "users",
        sa.Column("id",            UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("email",         sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role",          sa.Enum("ADMIN", "TEACHER", "STUDENT", name="user_role_enum"), nullable=False),
        sa.Column("is_active",     sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("last_login",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",    sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_users_email", "users", ["email"], unique=True)

    # 2. token_blacklist
    op.create_table(
        "token_blacklist",
        sa.Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("jti",            sa.String(255), nullable=False),
        sa.Column("user_id",        UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at",     sa.DateTime(timezone=True), nullable=False),
        sa.Column("blacklisted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_token_blacklist_jti", "token_blacklist", ["jti"], unique=True)

    # 3. teachers
    op.create_table(
        "teachers",
        sa.Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id",        UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("employee_code",  sa.String(20),  nullable=False),
        sa.Column("first_name",     sa.String(100), nullable=False),
        sa.Column("last_name",      sa.String(100), nullable=False),
        sa.Column("department",     sa.String(100), nullable=False),
        sa.Column("specialization", sa.String(200), nullable=True),
        sa.Column("qualification",  sa.String(200), nullable=True),
        sa.Column("joining_date",   sa.Date,        nullable=False),
        sa.Column("is_active",      sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_teachers_employee_code", "teachers", ["employee_code"], unique=True)
    op.create_index("idx_teachers_department",    "teachers", ["department"])

    # 4. students
    op.create_table(
        "students",
        sa.Column("id",             UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id",        UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("student_code",   sa.String(20),  nullable=False),
        sa.Column("first_name",     sa.String(100), nullable=False),
        sa.Column("last_name",      sa.String(100), nullable=False),
        sa.Column("gender",         sa.String(10),  nullable=True),
        sa.Column("date_of_birth",  sa.Date,        nullable=True),
        sa.Column("phone",          sa.String(20),  nullable=True),
        sa.Column("address",        sa.Text,        nullable=True),
        sa.Column("program",        sa.String(100), nullable=False),
        sa.Column("department",     sa.String(100), nullable=False),
        sa.Column("admission_date", sa.Date,        nullable=False),
        sa.Column("is_active",      sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_students_student_code", "students", ["student_code"], unique=True)
    op.create_index("idx_students_department",   "students", ["department"])
    op.create_index("idx_students_user_id",      "students", ["user_id"])

    # 5. subjects
    op.create_table(
        "subjects",
        sa.Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("subject_name", sa.String(200), nullable=False),
        sa.Column("subject_code", sa.String(20),  nullable=False),
        sa.Column("credit_hours", sa.Integer,     nullable=False, server_default=sa.text("3")),
        sa.Column("department",   sa.String(100), nullable=False),
        sa.Column("is_active",    sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",   sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_subjects_subject_code", "subjects", ["subject_code"], unique=True)

    # 6. classes
    op.create_table(
        "classes",
        sa.Column("id",                  UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("class_name",          sa.String(100), nullable=False),
        sa.Column("class_code",          sa.String(20),  nullable=False),
        sa.Column("program",             sa.String(100), nullable=False),
        sa.Column("department",          sa.String(100), nullable=False),
        sa.Column("semester",            sa.Integer,     nullable=False),
        sa.Column("academic_year",       sa.String(10),  nullable=False),
        sa.Column("homeroom_teacher_id", UUID(as_uuid=True), sa.ForeignKey("teachers.id"), nullable=True),
        sa.Column("is_active",           sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at",          sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",          sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("semester BETWEEN 1 AND 8", name="chk_classes_semester_range"),
    )
    op.create_index("idx_classes_class_code", "classes", ["class_code"], unique=True)

    # 7. class_subjects
    op.create_table(
        "class_subjects",
        sa.Column("id",         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("class_id",   UUID(as_uuid=True), sa.ForeignKey("classes.id"),  nullable=False),
        sa.Column("subject_id", UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("teacher_id", UUID(as_uuid=True), sa.ForeignKey("teachers.id"), nullable=False),
        sa.UniqueConstraint("class_id", "subject_id", name="uq_class_subject"),
    )

    # 8. enrollments
    op.create_table(
        "enrollments",
        sa.Column("id",              UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",      UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("class_id",        UUID(as_uuid=True), sa.ForeignKey("classes.id"),  nullable=False),
        sa.Column("enrollment_date", sa.Date, nullable=False, server_default=sa.func.current_date()),
        sa.Column("status",          sa.String(20), nullable=False, server_default=sa.text("'ACTIVE'")),
        sa.UniqueConstraint("student_id", "class_id", name="uq_student_class"),
    )

    # 9. attendance
    op.create_table(
        "attendance",
        sa.Column("id",              UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",      UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("class_id",        UUID(as_uuid=True), sa.ForeignKey("classes.id"),  nullable=False),
        sa.Column("subject_id",      UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("attendance_date", sa.Date,       nullable=False),
        sa.Column("status",          sa.String(10), nullable=False),
        sa.Column("recorded_by",     UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint(
            "student_id", "subject_id", "attendance_date",
            name="uq_attendance_student_subject_date"
        ),
    )
    op.create_index("idx_attendance_student_date", "attendance", ["student_id", "attendance_date"])
    op.create_index("idx_attendance_class_date",   "attendance", ["class_id",   "attendance_date"])
    op.create_index("idx_attendance_subject",      "attendance", ["subject_id"])

    # 10. marks
    op.create_table(
        "marks",
        sa.Column("id",          UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",  UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("subject_id",  UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("class_id",    UUID(as_uuid=True), sa.ForeignKey("classes.id"),  nullable=False),
        sa.Column("mark_type",   sa.String(20), nullable=False),
        sa.Column("score",       sa.Float, nullable=False),
        sa.Column("max_score",   sa.Float, nullable=False),
        sa.Column("recorded_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at",  sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",  sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("score >= 0",    name="chk_marks_score_non_negative"),
        sa.CheckConstraint("max_score > 0", name="chk_marks_max_score_positive"),
    )
    op.create_index("idx_marks_student_subject", "marks", ["student_id", "subject_id"])
    op.create_index("idx_marks_class_type",      "marks", ["class_id",   "mark_type"])

    # 11. gpa_records
    op.create_table(
        "gpa_records",
        sa.Column("id",            UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",    UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("semester",      sa.String(20), nullable=False),
        sa.Column("academic_year", sa.String(10), nullable=False),
        sa.Column("gpa",           sa.Float,      nullable=False),
        sa.Column("cgpa",          sa.Float,      nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_gpa_records_student", "gpa_records", ["student_id"])

    # 12. predictions
    op.create_table(
        "predictions",
        sa.Column("id",                  UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",          UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("subject_id",          UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=True),
        sa.Column("predicted_grade",     sa.String(3),  nullable=True),
        sa.Column("predicted_score",     sa.Float,      nullable=True),
        sa.Column("failure_probability", sa.Float,      nullable=False),
        sa.Column("risk_level",          sa.String(10), nullable=False),
        sa.Column("pass_fail",           sa.String(5),  nullable=True),
        sa.Column("feature_snapshot",    JSONB,         nullable=True),
        sa.Column("predicted_at",        sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_predictions_student", "predictions", ["student_id"])

    # 13. recommendations
    op.create_table(
        "recommendations",
        sa.Column("id",                  UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",          UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("recommendation_type", sa.String(30), nullable=False),
        sa.Column("message",             sa.Text,       nullable=False),
        sa.Column("priority",            sa.String(10), nullable=False),
        sa.Column("is_read",             sa.Boolean,    nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at",          sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_recommendations_student", "recommendations", ["student_id"])

    # 14. notifications
    op.create_table(
        "notifications",
        sa.Column("id",                UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("student_id",        UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("triggered_by",      UUID(as_uuid=True), sa.ForeignKey("users.id"),    nullable=True),
        sa.Column("notification_type", sa.String(30), nullable=False),
        sa.Column("severity",          sa.String(10), nullable=False),
        sa.Column("message",           sa.Text,       nullable=False),
        sa.Column("is_resolved",       sa.Boolean,    nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at",        sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_notifications_student", "notifications", ["student_id"])

    # 15. reports
    op.create_table(
        "reports",
        sa.Column("id",           UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("generated_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("report_type",  sa.String(20),  nullable=False),
        sa.Column("parameters",   JSONB,           nullable=True),
        sa.Column("file_path",    sa.String(500),  nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("notifications")
    op.drop_table("recommendations")
    op.drop_table("predictions")
    op.drop_table("gpa_records")
    op.drop_table("marks")
    op.drop_table("attendance")
    op.drop_table("enrollments")
    op.drop_table("class_subjects")
    op.drop_table("classes")
    op.drop_table("subjects")
    op.drop_table("students")
    op.drop_table("teachers")
    op.drop_table("token_blacklist")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role_enum")