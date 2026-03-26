"""
Authentication Models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    """User model"""
    email: str
    name: str
    user_type: str = "monitor"
    phone: Optional[str] = None
    recovery_email: Optional[str] = None
    alternate_contact: Optional[str] = None
    camera_id: Optional[str] = None
    email_verified: bool = True
    phone_verified: bool = False

class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    name: str
    password: str
    user_type: str = "monitor"
    phone: Optional[str] = None
    recovery_email: Optional[str] = None
    alternate_contact: Optional[str] = None

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    phone: Optional[str] = None
    recovery_email: Optional[EmailStr] = None
    alternate_contact: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class PasswordChange(BaseModel):
    """Password change model"""
    current_password: str
    new_password: str

class PasswordReset(BaseModel):
    """Password reset model"""
    email: EmailStr
    token: str
    new_password: str

class VerificationCode(BaseModel):
    """Verification code model"""
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    """Verify code request model"""
    email: EmailStr
    code: str

class ResetPasswordWithCode(BaseModel):
    """Reset password with code model"""
    email: EmailStr
    code: str
    new_password: str

class RecoveryEmailAdd(BaseModel):
    """Recovery email addition model"""
    recovery_email: EmailStr

class TokenData(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    user: User

class UserProfile(BaseModel):
    """User profile model"""
    user_id: str
    name: str
    embedding_path: Optional[str] = None
    calibration_data: Optional[dict] = None
    face_recognition_model: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class APIResponse(BaseModel):
    """Generic API response model"""
    message: str
    success: bool = True
    data: Optional[dict] = None
    error: Optional[str] = None

class EmailRequest(BaseModel):
    """Generic email request model"""
    email: EmailStr
    use_alternate_email: bool = False
