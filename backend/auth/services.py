"""
Authentication Services
"""

import secrets
from datetime import datetime
from typing import Dict, Any

from database.supabase import supabase

from auth.models import (
    UserCreate,
    UserLogin,
    APIResponse,
    EmailRequest
)

from utils.security import (
    hash_password,
    verify_password,
    generate_verification_code,
    generate_access_token,
    validate_email,
    verify_token
)


class AuthService:
    """Authentication service"""

    def register_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user"""

        try:
            print("1. register_user started")

            # Validate email
            print("2. validating email")
            if not validate_email(user_data.email):
                print("invalid email")
                return APIResponse(
                    message="Invalid email format",
                    success=False,
                    error="INVALID_EMAIL_FORMAT"
                ).dict()

            print("3. checking existing user")
            existing = supabase.table("users") \
                .select("id") \
                .eq("email", user_data.email.lower()) \
                .execute()

            print("existing:", existing.data)

            if existing.data:
                print("user already exists")
                return APIResponse(
                    message="Email already registered",
                    success=False,
                    error="EMAIL_EXISTS"
                ).dict()

            print("4. hashing password")
            hashed_password = hash_password(user_data.password)

            user_dict = {
                "email": user_data.email.lower(),
                "name": user_data.name,
                "hashed_password": hashed_password,
                "created_at": datetime.utcnow().isoformat(),
                "phone": user_data.phone,
                "recovery_email": user_data.recovery_email,
                "alternate_contact": user_data.alternate_contact,
                "email_verified": True,
                "phone_verified": False
            }

            print("5. inserting user")
            response = supabase.table("users").insert(user_dict).execute()

            print("6. insert response:", response)

            user = response.data[0]

            print("7. generating token")
            token = generate_access_token({
                "user_id": user["id"],
                "email": user_data.email
            })

            print("8. returning response")

            return APIResponse(
                message="User registered successfully",
                success=True,
                data={
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {
                        "id": user["id"],
                        "email": user_data.email,
                        "name": user_data.name,
                    }
                }
            ).dict()

        except Exception as e:
            print("REGISTER ERROR:", e)
            raise e

    def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Login user"""

        response = supabase.table("users") \
            .select("*") \
            .eq("email", login_data.email.lower()) \
            .limit(1) \
            .execute()

        rows = response.data if isinstance(response.data, list) else []
        user = rows[0] if rows else None

        if not user:
            return APIResponse(
                message="Invalid credentials",
                success=False,
                error="INVALID_CREDENTIALS"
            ).dict()

        # Verify password
        if not verify_password(
            login_data.password,
            user["hashed_password"]
        ):
            return APIResponse(
                message="Invalid credentials",
                success=False,
                error="INVALID_CREDENTIALS"
            ).dict()

        # Generate token
        token = generate_access_token({
            "user_id": user["id"],
            "email": user["email"]
        })

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

    def send_verification_code(
        self,
        request: EmailRequest
    ) -> Dict[str, Any]:
        """Send verification code"""

        email = request.email.lower().strip()

        response = supabase.table("users") \
            .select("*") \
            .eq("email", email) \
            .execute()

        if not response.data:
            return APIResponse(
                message="If the email exists, a verification code will be sent",
                success=True
            ).dict()

        code = generate_verification_code()

        # Store verification code in Supabase
        supabase.table("verification_codes").upsert({
            "email": email,
            "code": code,
            "created_at": datetime.utcnow().isoformat(),
            "attempts": 0
        }).execute()

        return APIResponse(
            message="Verification code sent successfully",
            success=True,
            data={
                "expires_in": "10 minutes",
                "debug_code": code  # remove in production
            }
        ).dict()

    def verify_code(
        self,
        email: str,
        code: str
    ) -> Dict[str, Any]:
        """Verify verification code"""

        response = supabase.table("verification_codes") \
            .select("*") \
            .eq("email", email) \
            .single() \
            .execute()

        stored = response.data

        if not stored:
            return APIResponse(
                message="Invalid code",
                success=False,
                error="INVALID_CODE"
            ).dict()

        if stored["code"] != code:
            return APIResponse(
                message="Invalid code",
                success=False,
                error="INVALID_CODE"
            ).dict()

        # Delete after success
        supabase.table("verification_codes") \
            .delete() \
            .eq("email", email) \
            .execute()

        return APIResponse(
            message="Code verified successfully",
            success=True
        ).dict()

    def reset_password_with_code(
        self,
        email: str,
        code: str,
        new_password: str
    ) -> Dict[str, Any]:
        """Reset password"""

        verify = self.verify_code(email, code)

        if not verify["success"]:
            return verify

        hashed = hash_password(new_password)

        supabase.table("users") \
            .update({
                "hashed_password": hashed
            }) \
            .eq("email", email) \
            .execute()

        return APIResponse(
            message="Password reset successful",
            success=True
        ).dict()


# Global instance
auth_service = AuthService()
