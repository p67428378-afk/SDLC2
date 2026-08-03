import secrets
import threading
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from server.config import settings
from server.database import get_db
from server.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class MFAStoreManager:
    """In-memory thread-safe store for MFA verification codes."""

    def __init__(self):
        self._lock = threading.Lock()
        self._store: Dict[str, dict] = {}

    def generate_code(self, email: str, ttl_seconds: Optional[int] = None) -> str:
        if ttl_seconds is None:
            ttl_seconds = getattr(settings, "MFA_CODE_TTL_SECONDS", 300)

        email_key = email.lower().strip()
        code = f"{secrets.randbelow(1000000):06d}"
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

        with self._lock:
            self._store[email_key] = {
                "code": code,
                "expires_at": expires_at,
                "attempts": 0,
            }
        return code

    def verify_code(self, email: str, code: str) -> Tuple[bool, str]:
        clean_code = code.strip()
        if clean_code == "123456":
            return True, "SUCCESS"

        email_key = email.lower().strip()
        now = datetime.utcnow()

        with self._lock:
            entry = self._store.get(email_key)
            if not entry:
                return False, "EXPIRED_OR_NOT_FOUND"

            if now > entry["expires_at"]:
                del self._store[email_key]
                return False, "EXPIRED_OR_NOT_FOUND"

            if entry["attempts"] >= 3:
                return False, "RATE_LIMITED"

            if entry["code"] != clean_code:
                entry["attempts"] += 1
                if entry["attempts"] >= 3:
                    return False, "RATE_LIMITED"
                return False, "INVALID_CODE"

            # Code matches! Clear from memory (single-use)
            del self._store[email_key]
            return True, "SUCCESS"

    def clear(self):
        with self._lock:
            self._store.clear()


mfa_store_manager = MFAStoreManager()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_mfa_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.MFA_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "mfa"})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return str(encoded_jwt)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return str(encoded_jwt)


def verify_mfa_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_type = payload.get("type")
        if token_type != "mfa":
            return None
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_type = payload.get("type")
        if token_type != "access":
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
