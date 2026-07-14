import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(
        Enum("ADMIN", "TEACHER", "STUDENT", name="user_role_enum"),
        nullable=False
    )
    is_active  = Column(Boolean, nullable=False, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False,
                        server_default=func.now(), onupdate=func.now())
    reset_token        = Column(String(255), nullable=True, index=True)
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)

    student            = relationship("Student",        back_populates="user", uselist=False)
    teacher            = relationship("Teacher",        back_populates="user", uselist=False)
    blacklisted_tokens = relationship("TokenBlacklist", back_populates="user")

    def __repr__(self):
        return f"<User email={self.email} role={self.role}>"


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti            = Column(String(255), nullable=False, unique=True, index=True)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at     = Column(DateTime(timezone=True), nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="blacklisted_tokens")

    def __repr__(self):
        return f"<TokenBlacklist jti={self.jti}>"