"""
Security Utilities
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    import secrets
    return f"{secrets.randbelow(1000000):06d}"

def generate_access_token() -> str:
    """Generate access token"""
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    """Generate password reset token"""
    import uuid
    return str(uuid.uuid4())

def is_token_expired(created_at: str, expires_minutes: int = 30) -> bool:
    """Check if token is expired"""
    try:
        created_time = datetime.fromisoformat(created_at)
        return datetime.now() > created_time + timedelta(minutes=expires_minutes)
    except (ValueError, TypeError):
        return True  # Invalid format means expired

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone: str) -> bool:
    """Validate phone number (digits only, 10-15 digits)"""
    if not phone:
        return False
    return phone.isdigit() and 10 <= len(phone) <= 15

def is_email_unique(email: str, exclude_email: Optional[str] = None) -> bool:
    """Check if email is unique (excluding current user)"""
    from database.models import db
    email = email.lower().strip()
    
    for user_email in db.users_db.keys():
        if user_email != exclude_email and user_email == email:
            return False
    return True

def is_phone_unique(phone: str, exclude_phone: Optional[str] = None) -> bool:
    """Check if phone is unique (excluding current user)"""
    from database.models import db
    if not phone:
        return True
    
    for user in db.users_db.values():
        user_phone = user.get("phone")
        if user_phone and user_phone != exclude_phone and user_phone == phone:
            return False
    return True

def sanitize_input(input_string: str) -> str:
    """Sanitize user input"""
    import html
    return html.escape(input_string.strip())

def validate_file_extension(filename: str) -> bool:
    """Validate file extension"""
    from config.settings import settings
    return any(filename.lower().endswith(ext) for ext in settings.ALLOWED_EXTENSIONS)

def validate_file_size(file_size: int) -> bool:
    """Validate file size"""
    from config.settings import settings
    return file_size <= settings.MAX_FILE_SIZE

def verify_token(token: str) -> bool:
    """Verify access token using database"""
    from database.models import db
    return db.get_user_by_token(token) is not None
