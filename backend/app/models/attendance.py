import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    class_id        = Column(UUID(as_uuid=True), ForeignKey("classes.id"),  nullable=False, index=True)
    subject_id      = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False, index=True)
    attendance_date = Column(Date,        nullable=False, index=True)
    status          = Column(String(10),  nullable=False)
    recorded_by     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at      = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint(
            "student_id", "subject_id", "attendance_date",
            name="uq_attendance_student_subject_date"
        ),
    )

    student  = relationship("Student", back_populates="attendances")
    class_   = relationship("Class",   back_populates="attendances")
    subject  = relationship("Subject", back_populates="attendances")
    recorder = relationship("User",    foreign_keys=[recorded_by])

    def __repr__(self):
        return f"<Attendance student={self.student_id} date={self.attendance_date} status={self.status}>"