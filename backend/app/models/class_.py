import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Class(Base):
    __tablename__ = "classes"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_name          = Column(String(100), nullable=False)
    class_code          = Column(String(20),  nullable=False, unique=True, index=True)
    program             = Column(String(100), nullable=False)
    department          = Column(String(100), nullable=False)
    semester            = Column(Integer,     nullable=False)
    academic_year       = Column(String(10),  nullable=False)
    homeroom_teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    is_active           = Column(Boolean, nullable=False, default=True)
    created_at          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), nullable=False,
                                 server_default=func.now(), onupdate=func.now())

    homeroom_teacher = relationship("Teacher",      back_populates="classes")
    class_subjects   = relationship("ClassSubject", back_populates="class_")
    enrollments      = relationship("Enrollment",   back_populates="class_")
    attendances      = relationship("Attendance",   back_populates="class_")
    marks            = relationship("Marks",        back_populates="class_")

    def __repr__(self):
        return f"<Class code={self.class_code} year={self.academic_year}>"


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id   = Column(UUID(as_uuid=True), ForeignKey("classes.id"),  nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "subject_id", name="uq_class_subject"),
    )

    class_  = relationship("Class",   back_populates="class_subjects")
    subject = relationship("Subject", back_populates="class_subjects")
    teacher = relationship("Teacher", back_populates="class_subjects")

    def __repr__(self):
        return f"<ClassSubject class={self.class_id} subject={self.subject_id}>"