import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User, TokenBlacklist
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)


def login_user(email: str, password: str, db: Session) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact administrator.")

    user.last_login = datetime.utcnow()
    db.commit()

    access_token  = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    # Build the user payload. Two enrichments over the bare id/email/role:
    #  - full_name: promised by doc Section 7.1's response example,
    #    never implemented until now. Pulled from the role's profile row.
    #  - student_id (STUDENT role only): concluded with Roshan — the
    #    frontend needs students.id for analytics/predictions/
    #    recommendations endpoints, and users.id != students.id.
    #    Uses the User.student / User.teacher relationships (uselist=False),
    #    so no extra explicit query is needed.
    user_payload = {
        "id":        str(user.id),
        "email":     user.email,
        "role":      user.role,
        "full_name": None,
    }

    if user.role == "STUDENT" and user.student:
        user_payload["student_id"] = str(user.student.id)
        user_payload["full_name"]  = f"{user.student.first_name} {user.student.last_name}"
    elif user.role == "TEACHER" and user.teacher:
        user_payload["teacher_id"] = str(user.teacher.id)
        user_payload["full_name"]  = f"{user.teacher.first_name} {user.teacher.last_name}"

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "expires_in":    900,
        "user":          user_payload
    }


def logout_user(token: str, user_id: str, db: Session) -> dict:
    payload = decode_token(token)
    if payload:
        jti = payload.get("jti", str(uuid.uuid4()))
        exp = datetime.utcfromtimestamp(payload.get("exp", 0))
        blacklisted = TokenBlacklist(
            jti        = jti,
            user_id    = user_id,
            expires_at = exp
        )
        db.add(blacklisted)
        db.commit()
    return {"message": "Successfully logged out"}


def refresh_access_token(refresh_token: str, db: Session) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")

    user_id = payload.get("sub")
    user    = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "expires_in":   900
    }


def forgot_password(email: str, db: Session) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if user:
        reset_token = str(uuid.uuid4())
        expiry      = datetime.utcnow() + timedelta(hours=1)
        user.reset_token        = reset_token
        user.reset_token_expiry = expiry
        db.commit()
    return {"message": "If this email exists, a reset link has been sent."}


def reset_password(token: str, new_password: str, db: Session) -> dict:
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Reset token is invalid or has expired")
    if user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token is invalid or has expired")

    user.password_hash      = hash_password(new_password)
    user.reset_token        = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password reset successfully. Please log in."}


def change_password(user_id: str, current_password: str, new_password: str, db: Session) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}