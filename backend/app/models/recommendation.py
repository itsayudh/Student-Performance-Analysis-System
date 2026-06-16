import uuid
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id          = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    recommendation_type = Column(String(30), nullable=False)
    message             = Column(Text,       nullable=False)
    priority            = Column(String(10), nullable=False)
    is_read             = Column(Boolean,    nullable=False, default=False)
    created_at          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student = relationship("Student", back_populates="recommendations")

    def __repr__(self):
        return f"<Recommendation student={self.student_id} type={self.recommendation_type} priority={self.priority}>"