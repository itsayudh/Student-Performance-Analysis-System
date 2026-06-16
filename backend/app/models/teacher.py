import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    employee_code  = Column(String(20),  nullable=False, unique=True, index=True)
    first_name     = Column(String(100), nullable=False)
    last_name      = Column(String(100), nullable=False)
    department     = Column(String(100), nullable=False, index=True)
    specialization = Column(String(200), nullable=True)
    qualification  = Column(String(200), nullable=True)
    joining_date   = Column(Date,        nullable=False)
    is_active      = Column(Boolean,     nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), nullable=False,
                            server_default=func.now(), onupdate=func.now())

    user           = relationship("User",         back_populates="teacher")
    classes        = relationship("Class",        back_populates="homeroom_teacher")
    class_subjects = relationship("ClassSubject", back_populates="teacher")

    def __repr__(self):
        return f"<Teacher code={self.employee_code} name={self.first_name} {self.last_name}>"