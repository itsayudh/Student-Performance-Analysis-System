import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    class_id        = Column(UUID(as_uuid=True), ForeignKey("classes.id"),  nullable=False)
    enrollment_date = Column(Date, nullable=False, server_default=func.current_date())
    status          = Column(String(20), nullable=False, default="ACTIVE")

    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
    )

    student = relationship("Student", back_populates="enrollments")
    class_  = relationship("Class",   back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment student={self.student_id} class={self.class_id} status={self.status}>"