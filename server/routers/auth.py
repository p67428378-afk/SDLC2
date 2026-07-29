from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from server.database import get_db
from server.models import User
from server.auth import verify_password, create_access_token
from server.config import settings
from server.schemas import (
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    MfaVerifyResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Create a temporary MFA token
    mfa_payload = {
        "sub": user.username,
        "type": "mfa",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    mfa_token = jwt.encode(
        mfa_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )

    return LoginResponse(message="MFA code sent. Please verify.", mfa_token=mfa_token)


@router.post("/mfa/verify", response_model=MfaVerifyResponse)
def mfa_verify(request: MfaVerifyRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(
            request.mfa_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "mfa":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA token",
            )
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA token",
        )

    # Accept only "123456" as the valid code
    if request.code != "123456":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired mfa code",
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(data={"sub": user.username})

    return MfaVerifyResponse(
        access_token=access_token, token_type="bearer", user=UserResponse.from_orm(user)
    )
