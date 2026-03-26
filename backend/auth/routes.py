"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.models import UserCreate, UserLogin, VerifyCodeRequest, ResetPasswordWithCode, EmailRequest, TokenData
from auth.services import auth_service
from utils.security import verify_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    return auth_service.register_user(user_data)

@router.post("/login")
async def login(login_data: UserLogin):
    """Login user"""
    return auth_service.login_user(login_data)

@router.post("/forgot-password")
async def forgot_password(request: EmailRequest):
    """Send verification code for password reset"""
    return auth_service.send_verification_code(request)

@router.post("/forgot-password-alternate")
async def forgot_password_alternate(request: EmailRequest):
    """Send verification code for password reset (alternate endpoint)"""
    return auth_service.send_verification_code(request)

@router.post("/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """Verify verification code"""
    return auth_service.verify_code(request.email, request.code)

@router.post("/reset-password-with-code")
async def reset_password_with_code(request: ResetPasswordWithCode):
    """Reset password using verified code"""
    return auth_service.reset_password_with_code(request.email, request.code, request.new_password)

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    from database.models import db
    db.delete_token(credentials.credentials)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user info"""
    from database.models import db
    
    user = db.get_user_by_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "user_type": user.get("user_type", "monitor"),
        "camera_id": user.get("camera_id"),
        "phone": user.get("phone"),
        "recovery_email": user.get("recovery_email"),
        "alternate_contact": user.get("alternate_contact"),
        "email_verified": user.get("email_verified", True),
        "phone_verified": user.get("phone_verified", False)
    }
