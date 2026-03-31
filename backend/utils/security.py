"""
Security Utilities
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from fastapi import HTTPException

from config.settings import settings


# =========================
# Password Utilities
# =========================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed


# =========================
# JWT Token Utilities
# =========================

def generate_access_token(data: dict) -> str:
    """Generate JWT access token"""

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str):
    """Verify JWT token"""

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )


# =========================
# Verification Utilities
# =========================

def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    return f"{secrets.randbelow(1000000):06d}"


def generate_reset_token() -> str:
    """Generate password reset token"""
    import uuid
    return str(uuid.uuid4())


def is_token_expired(created_at: str, expires_minutes: int = 30) -> bool:
    """Check if token is expired"""
    try:
        created_time = datetime.fromisoformat(created_at)
        return datetime.utcnow() > created_time + timedelta(minutes=expires_minutes)
    except (ValueError, TypeError):
        return True


# =========================
# Validation Utilities
# =========================

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    if not phone:
        return False

    return phone.isdigit() and 10 <= len(phone) <= 15


def sanitize_input(input_string: str) -> str:
    """Sanitize user input"""
    import html

    return html.escape(input_string.strip())


# =========================
# File Validation
# =========================

def validate_file_extension(filename: str) -> bool:
    """Validate file extension"""
    from config.settings import settings

    return any(
        filename.lower().endswith(ext)
        for ext in settings.ALLOWED_EXTENSIONS
    )


def validate_file_size(file_size: int) -> bool:
    """Validate file size"""
    from config.settings import settings

    return file_size <= settings.MAX_FILE_SIZE