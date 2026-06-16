import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Subject(Base):
    __tablename__ = "subjects"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_name = Column(String(200), nullable=False)
    subject_code = Column(String(20),  nullable=False, unique=True, index=True)
    credit_hours = Column(Integer,     nullable=False, default=3)
    department   = Column(String(100), nullable=False)
    is_active    = Column(Boolean,     nullable=False, default=True)
    created_at   = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), nullable=False,
                          server_default=func.now(), onupdate=func.now())

    class_subjects = relationship("ClassSubject", back_populates="subject")
    attendances    = relationship("Attendance",   back_populates="subject")
    marks          = relationship("Marks",        back_populates="subject")
    predictions    = relationship("Prediction",   back_populates="subject")

    def __repr__(self):
        return f"<Subject code={self.subject_code} name={self.subject_name}>"