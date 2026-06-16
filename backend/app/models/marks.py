import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Marks(Base):
    __tablename__ = "marks"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id  = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    subject_id  = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False, index=True)
    class_id    = Column(UUID(as_uuid=True), ForeignKey("classes.id"),  nullable=False, index=True)
    mark_type   = Column(String(20), nullable=False)
    score       = Column(Float, nullable=False)
    max_score   = Column(Float, nullable=False)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False,
                         server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("score >= 0",    name="chk_marks_score_non_negative"),
        CheckConstraint("max_score > 0", name="chk_marks_max_score_positive"),
    )

    student  = relationship("Student", back_populates="marks")
    subject  = relationship("Subject", back_populates="marks")
    class_   = relationship("Class",   back_populates="marks")
    recorder = relationship("User",    foreign_keys=[recorded_by])

    def __repr__(self):
        return f"<Marks student={self.student_id} type={self.mark_type} score={self.score}>"


class GPARecord(Base):
    __tablename__ = "gpa_records"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id    = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    semester      = Column(String(20), nullable=False)
    academic_year = Column(String(10), nullable=False)
    gpa           = Column(Float, nullable=False)
    cgpa          = Column(Float, nullable=False)
    calculated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student = relationship("Student", back_populates="gpa_records")

    def __repr__(self):
        return f"<GPARecord student={self.student_id} semester={self.semester} gpa={self.gpa}>"