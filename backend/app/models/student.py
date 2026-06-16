import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Student(Base):
    __tablename__ = "students"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    student_code   = Column(String(20),  nullable=False, unique=True, index=True)
    first_name     = Column(String(100), nullable=False)
    last_name      = Column(String(100), nullable=False)
    gender         = Column(String(10),  nullable=True)
    date_of_birth  = Column(Date,        nullable=True)
    phone          = Column(String(20),  nullable=True)
    address        = Column(Text,        nullable=True)
    program        = Column(String(100), nullable=False)
    department     = Column(String(100), nullable=False, index=True)
    admission_date = Column(Date,        nullable=False)
    is_active      = Column(Boolean,     nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), nullable=False,
                            server_default=func.now(), onupdate=func.now())

    user            = relationship("User",           back_populates="student")
    enrollments     = relationship("Enrollment",     back_populates="student")
    attendances     = relationship("Attendance",     back_populates="student")
    marks           = relationship("Marks",          back_populates="student")
    gpa_records     = relationship("GPARecord",      back_populates="student")
    predictions     = relationship("Prediction",     back_populates="student")
    recommendations = relationship("Recommendation", back_populates="student")
    notifications   = relationship("Notification",   back_populates="student")

    def __repr__(self):
        return f"<Student code={self.student_code} name={self.first_name} {self.last_name}>"