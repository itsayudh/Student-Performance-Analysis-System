

################### json dependency  Roshan old code####################
from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth_service import (
    login_user, logout_user, refresh_access_token,
    forgot_password, reset_password, change_password
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(payload: dict, db: Session = Depends(get_db), response: Response = None):
    email    = payload.get("email")
    password = payload.get("password")
    result   = login_user(email, password, db)

    response.set_cookie(
        key      = "__Secure-refresh-token",
        value    = result["refresh_token"],
        httponly = True,
        secure   = True,
        samesite = "strict",
        max_age  = 7 * 24 * 60 * 60
    )

    del result["refresh_token"]
    return result


# ######################  form data dependency  ayudh new code ######################
# from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
# from fastapi.security import OAuth2PasswordRequestForm
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.services.auth_service import (
#     login_user, logout_user, refresh_access_token,
#     forgot_password, reset_password, change_password
# )
# from app.api.deps import get_current_user

# router = APIRouter(prefix="/auth", tags=["Authentication"])


# @router.post("/login")
# def login(
#     # Changed from payload: dict to Form data dependency
#     form_data: OAuth2PasswordRequestForm = Depends(), 
#     db: Session = Depends(get_db), 
#     response: Response = None
# ):
#     # OAuth2PasswordRequestForm maps the first input field to .username
#     email    = form_data.username  
#     password = form_data.password
#     result   = login_user(email, password, db)

#     response.set_cookie(
#         key      = "__Secure-refresh-token",
#         value    = result["refresh_token"],
#         httponly = True,
#         secure   = True,
#         samesite = "strict",
#         max_age  = 7 * 24 * 60 * 60
#     )

#     del result["refresh_token"]
    
#     # Swagger expects a JSON response containing "access_token" and "token_type"
#     # Ensure your login_user service returns "access_token" as a key!
#     return result

# # ... Keep the rest of your routes (logout, refresh, etc.) exactly the same









@router.post("/logout")
def logout(
    request:      Request,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user),
    response:     Response = None
):
    token  = request.headers.get("Authorization", "").replace("Bearer ", "")
    result = logout_user(token, str(current_user.id), db)
    response.delete_cookie("__Secure-refresh-token")
    return result


@router.post("/refresh")
def refresh(request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("__Secure-refresh-token")
    return refresh_access_token(refresh_token, db)


@router.post("/forgot-password")
def forgot_password_route(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    return forgot_password(email, db)


@router.post("/reset-password")
def reset_password_route(payload: dict, db: Session = Depends(get_db)):
    token        = payload.get("token")
    new_password = payload.get("new_password")
    confirm      = payload.get("confirm_password")
    if new_password != confirm:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Passwords do not match")
    return reset_password(token, new_password, db)


@router.post("/change-password")
def change_password_route(
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    current  = payload.get("current_password")
    new_pass = payload.get("new_password")
    return change_password(str(current_user.id), current, new_pass, db)