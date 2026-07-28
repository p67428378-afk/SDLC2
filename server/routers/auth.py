from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import (
    LoginRequest,
    LoginResponse,
    MFAVerifyRequest,
    TokenResponse,
    UserResponse,
)
from server.auth import (
    verify_password,
    create_mfa_token,
    create_access_token,
    verify_mfa_token,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Create MFA token
    mfa_token = create_mfa_token({"sub": user.username})
    return LoginResponse(message="MFA code sent. Please verify.", mfa_token=mfa_token)


@router.post("/mfa/verify", response_model=TokenResponse)
def mfa_verify(payload: MFAVerifyRequest, db: Session = Depends(get_db)):
    # Verify MFA token
    token_data = verify_mfa_token(payload.mfa_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA token",
        )

    # Verify MFA code (default is "000000")
    if payload.code != "000000":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA code",
        )

    username = token_data.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    # Create access token
    access_token = create_access_token({"sub": user.username})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(id=str(user.id), username=user.username),
    )
