"""
Authentication & Authorization Module.
Provides bcrypt password hashing, JWT token creation/verification,
and role-based dependency checks (Admin / Analyst).
"""

import time
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

# Simple in-memory rate limiting for login attempts
_login_attempts: Dict[str, list] = {}
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300  # 5 minutes


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def check_rate_limit(ip_or_email: str) -> bool:
    """Check if attempts exceeded within window."""
    now = time.time()
    attempts = _login_attempts.get(ip_or_email, [])
    # Filter attempts within WINDOW_SECONDS
    valid_attempts = [t for t in attempts if now - t < WINDOW_SECONDS]
    _login_attempts[ip_or_email] = valid_attempts
    return len(valid_attempts) < MAX_ATTEMPTS


def record_failed_attempt(ip_or_email: str):
    now = time.time()
    attempts = _login_attempts.get(ip_or_email, [])
    attempts.append(now)
    _login_attempts[ip_or_email] = attempts


def reset_attempts(ip_or_email: str):
    if ip_or_email in _login_attempts:
        del _login_attempts[ip_or_email]


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this operation"
        )
    return current_user


def log_admin_action(
    db: Session,
    user_email: str,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Record administrative audit log into database."""
    log_entry = AuditLog(
        user_email=user_email,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        details=details,
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
