import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Report(Base):
    __tablename__ = "reports"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    report_type  = Column(String(20),  nullable=False)
    parameters   = Column(JSONB,       nullable=True)
    file_path    = Column(String(500), nullable=True)
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    generator = relationship("User", foreign_keys=[generated_by])

    def __repr__(self):
        return f"<Report type={self.report_type} generated_by={self.generated_by}>"