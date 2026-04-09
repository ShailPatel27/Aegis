"""
Authentication Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.models import (
    UserCreate,
    UserLogin,
    VerifyCodeRequest,
    ResetPasswordWithCode,
    EmailRequest
)

from auth.services import auth_service
from utils.security import verify_token, generate_access_token
from database.supabase import supabase

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    result = auth_service.register_user(user_data)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Registration failed")
        )
    
    return result


@router.post("/login")
async def login(login_data: UserLogin):
    """Login user"""
    result = auth_service.login_user(login_data)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=401,
            detail=result.get("message", "Login failed")
        )
    
    return result


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
    return auth_service.reset_password_with_code(
        request.email,
        request.code,
        request.new_password
    )


@router.post("/logout")
async def logout():
    """
    Logout user

    JWT is stateless so logout is handled client-side
    """
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current user info"""

    try:
        # Decode token
        token_data = verify_token(credentials.credentials)

        # Fetch user from Supabase
        response = supabase.table("users") \
            .select("*") \
            .eq("id", token_data["user_id"]) \
            .single() \
            .execute()

        user = response.data

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone"),
            "recovery_email": user.get("recovery_email"),
            "alternate_contact": user.get("alternate_contact"),
            "email_verified": user.get("email_verified", True),
            "phone_verified": user.get("phone_verified", False)
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )


@router.post("/refresh")
async def refresh_token(user=Depends(get_current_user)):
    """Issue a new token for an authenticated user"""
    new_token = generate_access_token({"user_id": user["id"], "email": user["email"]})
    return {"success": True, "token": new_token}