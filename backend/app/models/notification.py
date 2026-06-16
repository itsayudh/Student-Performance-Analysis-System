import uuid
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Notification(Base):
    __tablename__ = "notifications"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id        = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    triggered_by      = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notification_type = Column(String(30), nullable=False)
    severity          = Column(String(10), nullable=False)
    message           = Column(Text,       nullable=False)
    is_resolved       = Column(Boolean,    nullable=False, default=False)
    created_at        = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student        = relationship("Student", back_populates="notifications")
    triggered_user = relationship("User",    foreign_keys=[triggered_by])

    def __repr__(self):
        return f"<Notification student={self.student_id} severity={self.severity} resolved={self.is_resolved}>"