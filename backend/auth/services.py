"""
Authentication Services
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from database.models import db
from auth.models import UserCreate, UserLogin, TokenData, APIResponse, EmailRequest
from utils.security import (
    hash_password, verify_password, generate_verification_code, 
    generate_access_token, is_email_unique, validate_email
)

class AuthService:
    """Authentication service"""
    
    def register_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user"""
        # Validate email format
        if not validate_email(user_data.email):
            return APIResponse(
                message="Invalid email format",
                success=False,
                error="INVALID_EMAIL_FORMAT"
            ).dict()
        
        # Check if email already exists
        if not is_email_unique(user_data.email):
            return APIResponse(
                message="Email already registered",
                success=False,
                error="EMAIL_EXISTS"
            ).dict()
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        user_id = secrets.token_urlsafe(16)
        
        user_dict = {
            "id": user_id,
            "email": user_data.email.lower(),
            "name": user_data.name,
            "user_type": user_data.user_type,
            "hashed_password": hashed_password,
            "created_at": datetime.now().isoformat(),
            "phone": user_data.phone,
            "recovery_email": user_data.recovery_email,
            "alternate_contact": user_data.alternate_contact,
            "camera_id": self._generate_camera_id(user_data.user_type),
            "email_verified": True,
            "phone_verified": False
        }
        
        # Save user
        if db.create_user(user_data.email.lower(), user_dict):
            # Create and return token for auto-login
            token = generate_access_token()
            db.store_token(token, user_id)
            
            return APIResponse(
                message="User registered successfully",
                success=True,
                data={
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {
                        "id": user_id,
                        "email": user_data.email,
                        "name": user_data.name,
                        "user_type": user_data.user_type
                    }
                }
            ).dict()
        else:
            return APIResponse(
                message="Failed to create user",
                success=False,
                error="USER_CREATION_FAILED"
            ).dict()
    
    def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Login user"""
        user = db.get_user(login_data.email)
        
        if not user:
            return APIResponse(
                message="Invalid credentials",
                success=False,
                error="INVALID_CREDENTIALS"
            ).dict()
        
        if not verify_password(login_data.password, user["hashed_password"]):
            return APIResponse(
                message="Invalid credentials",
                success=False,
                error="INVALID_CREDENTIALS"
            ).dict()
        
        # Create and return token
        token = generate_access_token()
        db.store_token(token, user["id"])
        
        return APIResponse(
            message="Login successful",
            success=True,
            data={
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"]
                }
            }
        ).dict()
    
    def send_verification_code(self, request: EmailRequest) -> Dict[str, Any]:
        """Send verification code for password reset"""
        email = request.email.lower().strip()
        
        # Check if email exists (primary or recovery)
        user_found = None
        target_email = email
        
        if request.use_alternate_email:
            # Look for user with this email as primary and check recovery email
            for user_email, user_data in db.users_db.items():
                if user_email == email and user_data.get("recovery_email"):
                    user_found = user_data
                    target_email = user_data["recovery_email"]
                    break
        
            if not user_found:
                return APIResponse(
                    message="No alternate email configured for this account",
                    success=False,
                    error="NO_ALTERNATE_EMAIL"
                ).dict()
        else:
            # Regular email lookup
            for user_email, user_data in db.users_db.items():
                if user_email == email or user_data.get("recovery_email") == email:
                    user_found = user_data
                    break
        
        if not user_found:
            # Don't reveal if email exists or not for security
            return APIResponse(
                message="If the email exists, a verification code will be sent",
                success=True
            ).dict()
        
        # Generate and store verification code
        code = generate_verification_code()
        db.store_verification_code(target_email, code)
        
        return APIResponse(
            message="Verification code sent successfully",
            success=True,
            data={
                "expires_in": "10 minutes",
                "debug_code": code  # Remove in production
            }
        ).dict()
    
    def verify_code(self, email: str, code: str) -> Dict[str, Any]:
        """Verify verification code"""
        stored_data = db.get_verification_code(email)
        
        if not stored_data:
            return APIResponse(
                message="Invalid or expired verification code",
                success=False,
                error="INVALID_CODE"
            ).dict()
        
        # Check if code matches
        if stored_data["code"] != code:
            stored_data["attempts"] += 1
            db.save_verification_code(email, stored_data)
            
            if stored_data["attempts"] >= 3:
                db.delete_verification_code(email)
                return APIResponse(
                    message="Too many failed attempts. Please request a new code",
                    success=False,
                    error="TOO_MANY_ATTEMPTS"
                ).dict()
            
            return APIResponse(
                message="Invalid verification code",
                success=False,
                error="INVALID_CODE"
            ).dict()
        
        # Check if code is expired (10 minutes)
        created_at = datetime.fromisoformat(stored_data["created_at"])
        if datetime.now() > created_at + timedelta(minutes=10):
            db.delete_verification_code(email)
            return APIResponse(
                message="Verification code has expired",
                success=False,
                error="CODE_EXPIRED"
            ).dict()
        
        # Code is valid - remove it after successful verification
        db.delete_verification_code(email)
        
        return APIResponse(
            message="Code verified successfully",
            success=True,
            data={"email": email}
        ).dict()
    
    def reset_password_with_code(self, email: str, code: str, new_password: str) -> Dict[str, Any]:
        """Reset password using verified code"""
        # First verify the code
        verify_result = self.verify_code(email, code)
        if not verify_result["success"]:
            return verify_result
        
        # Find user and update password
        user = db.get_user(email)
        if not user:
            return APIResponse(
                message="User not found",
                success=False,
                error="USER_NOT_FOUND"
            ).dict()
        
        # Update password
        hashed_new_password = hash_password(new_password)
        user["hashed_password"] = hashed_new_password
        
        # Save changes
        db.save_all_data()
        
        return APIResponse(
            message="Password reset successfully",
            success=True,
            data={"email": email}
        ).dict()
    
    def _generate_camera_id(self, user_type: str) -> Optional[str]:
        """Generate camera ID for camera users"""
        if user_type == "camera":
            return f"CAM-{secrets.token_hex(4).upper()}"
        return None

# Global auth service instance
auth_service = AuthService()
