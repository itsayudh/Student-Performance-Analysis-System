import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id          = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    subject_id          = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=True)
    predicted_grade     = Column(String(3),  nullable=True)
    predicted_score     = Column(Float,      nullable=True)
    failure_probability = Column(Float,      nullable=False)
    risk_level          = Column(String(10), nullable=False)
    pass_fail           = Column(String(5),  nullable=True)
    feature_snapshot    = Column(JSONB,      nullable=True)
    predicted_at        = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student = relationship("Student", back_populates="predictions")
    subject = relationship("Subject", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction student={self.student_id} grade={self.predicted_grade} risk={self.risk_level}>"