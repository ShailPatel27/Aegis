from fastapi import FastAPI, File, UploadFile, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
import io
from PIL import Image
import numpy as np
import cv2
from ultralytics import YOLO
import torch
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
from dotenv import load_dotenv
import aiosmtplib
from email.message import EmailMessage
import re
import uuid

# Load environment variables
load_dotenv()

# Global variables for models
yolo_model = None

# Database storage (in production, use proper database)
users_db = {}
tokens_db = {}
verification_codes_db = {}  # Store verification codes
reset_tokens = {}  # For password reset tokens

# File-based persistence
import json
import os

USER_DB_FILE = "users.json"
VERIFICATION_CODES_FILE = "verification_codes.json"

def load_users():
    """Load users from file"""
    global users_db
    if os.path.exists(USER_DB_FILE):
        try:
            with open(USER_DB_FILE, 'r') as f:
                users_db = json.load(f)
                
            # Add new fields to existing users if they don't exist
            for email, user in users_db.items():
                if "phone" not in user:
                    user["phone"] = None
                if "recovery_email" not in user:
                    user["recovery_email"] = None
                if "alternate_contact" not in user:
                    user["alternate_contact"] = None
                if "camera_id" not in user and user.get("user_type") == "camera":
                    user["camera_id"] = f"CAM-{secrets.token_hex(4).upper()}"
                elif "camera_id" not in user:
                    user["camera_id"] = None
                if "email_verified" not in user:
                    user["email_verified"] = True
                if "phone_verified" not in user:
                    user["phone_verified"] = False
                    
            # Save updated structure
            save_users()
            
        except Exception as e:
            print(f"Error loading users: {e}")
            users_db = {}
    else:
        # Create default test user
        users_db = {
            "test@example.com": {
                "id": "test-user-123",
                "email": "test@example.com",
                "name": "Test User",
                "user_type": "monitor",
                "hashed_password": hash_password("test123"),
                "created_at": datetime.now().isoformat(),
                "phone": None,
                "recovery_email": None,
                "alternate_contact": None,
                "camera_id": None,
                "email_verified": True,
                "phone_verified": False
            }
        }
        save_users()

def save_users():
    """Save users to file"""
    try:
        with open(USER_DB_FILE, 'w') as f:
            json.dump(users_db, f, indent=2)
    except Exception as e:
        print(f"Error saving users: {e}")

def load_models():
    """Load AI models on startup"""
    global yolo_model
    try:
        # Load YOLOv8n model (nano version - faster and lighter)
        yolo_model = YOLO('yolov8n.pt')
        print("YOLOv8n model loaded successfully")
    except Exception as e:
        print(f"Error loading models: {e}")

def generate_verification_code():
    """Generate 6-digit verification code"""
    return ''.join(secrets.choice('0123456789') for _ in range(6))

def save_verification_codes():
    """Save verification codes to file"""
    try:
        with open(VERIFICATION_CODES_FILE, "w") as f:
            json.dump(verification_codes_db, f, indent=2)
    except Exception as e:
        print(f"Error saving verification codes: {e}")

def load_verification_codes():
    """Load verification codes from file"""
    global verification_codes_db
    try:
        if os.path.exists(VERIFICATION_CODES_FILE):
            with open(VERIFICATION_CODES_FILE, "r") as f:
                verification_codes_db = json.load(f)
    except Exception as e:
        print(f"Error loading verification codes: {e}")
        verification_codes_db = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_users()
    load_verification_codes()
    load_models()
    print("Backend server started successfully (standalone mode)")
    yield
    # Shutdown (if needed)
    pass

app = FastAPI(title="AEGIS Vision System API", version="1.0.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token():
    """Create a simple access token"""
    return secrets.token_urlsafe(32)

def create_reset_token():
    """Create a password reset token"""
    return str(uuid.uuid4())

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SMTP"""
    try:
        message = EmailMessage()
        message["From"] = os.getenv("USER_EMAIL")
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(html_content, subtype='html')
        
        await aiosmtplib.send(
            message,
            hostname=os.getenv("SMTP_HOST", "smtp.gmail.com"),
            port=int(os.getenv("SMTP_PORT", 587)),
            start_tls=True,
            username=os.getenv("USER_EMAIL"),
            password=os.getenv("USER_PASS"),
        )
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone: str) -> bool:
    """Validate phone number (digits only, 10-15 digits)"""
    if not phone:
        return False
    return phone.isdigit() and 10 <= len(phone) <= 15

def is_email_unique(email: str, exclude_current: str = None) -> bool:
    """Check if email is unique (excluding current user's email)"""
    for user_email in users_db.keys():
        if user_email != exclude_current and user_email == email:
            return False
    return True

def is_phone_unique(phone: str, exclude_current: str = None) -> bool:
    """Check if phone is unique (excluding current user's phone)"""
    for user in users_db.values():
        if user.get("phone") and user["phone"] != exclude_current and user["phone"] == phone:
            return False
    return True

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> bool:
    """Verify access token"""
    token = credentials.credentials
    return token in tokens_db

from pydantic import BaseModel

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    user_type: str = "monitor"

class LoginRequest(BaseModel):
    email: str
    password: str

class VerificationCodeRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ResetPasswordWithCodeRequest(BaseModel):
    email: str
    code: str
    new_password: str

class ForgotPasswordAlternateRequest(BaseModel):
    email: str
    use_alternate: bool = False

class PasswordResetRequest(BaseModel):
    token: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    recovery_email: Optional[str] = None
    alternate_contact: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class RecoveryEmailRequest(BaseModel):
    recovery_email: str

# Auth endpoints
@app.post("/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    # Validate email format
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Check if email already exists
    if not is_email_unique(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(request.password)
    user_id = secrets.token_urlsafe(16)
    users_db[request.email] = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "user_type": request.user_type,
        "hashed_password": hashed_password,
        "created_at": datetime.now().isoformat(),
        "phone": None,
        "recovery_email": None,
        "alternate_contact": None,
        "camera_id": None if request.user_type != "camera" else f"CAM-{secrets.token_hex(4).upper()}",
        "email_verified": True,
        "phone_verified": False
    }
    
    # Save users to file
    save_users()
    
    # Create and return token for auto-login
    token = create_access_token()
    tokens_db[token] = user_id
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": request.email,
            "name": request.name,
            "user_type": request.user_type
        }
    }

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    if request.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_db[request.email]
    if hash_password(request.password) != user["hashed_password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token()
    tokens_db[token] = user["id"]
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    }

@app.get("/auth/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user info"""
    token = credentials.credentials
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = tokens_db[token]
    for user in users_db.values():
        if user["id"] == user_id:
            return {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "user_type": user.get("user_type", "monitor"),
                "camera_id": user.get("camera_id"),
                "phone": user.get("phone"),
                "recovery_email": user.get("recovery_email"),
                "alternate_contact": user.get("alternate_contact")
            }
    
    raise HTTPException(status_code=401, detail="User not found")

@app.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    token = credentials.credentials
    if token in tokens_db:
        del tokens_db[token]
    
    return {"message": "Logged out successfully"}

@app.post("/auth/recovery-email")
async def add_recovery_email(request: RecoveryEmailRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Add or update recovery email with verification"""
    token = credentials.credentials
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user_id = tokens_db[token]
    
    # Validate email format
    if not validate_email(request.recovery_email):
        raise HTTPException(status_code=400, detail="Invalid recovery email format")
    
    # Find and update user
    for email, user in users_db.items():
        if user["id"] == user_id:
            # Check if recovery email is the same as primary email
            if request.recovery_email == user["email"]:
                raise HTTPException(status_code=400, detail="Recovery email cannot be the same as your primary email")
            
            # Check if recovery email is already registered as a primary account
            if request.recovery_email in users_db:
                raise HTTPException(status_code=400, detail="This email is already registered as a primary account")
            
            # Send verification email to recovery email
            html_content = f"""
            <html>
                <body>
                    <h2>Recovery Email Verification</h2>
                    <p>Hello,</p>
                    <p>{user['name']} ({user['email']}) has added you as a recovery contact for their AEGIS account.</p>
                    <p>If this is correct, no action is needed. Your email may be used to send password reset links if {user['name']} loses access to their account.</p>
                    <p>If you don't recognize this, you can safely ignore this email.</p>
                    <br>
                    <p>Best regards,<br>AEGIS Team</p>
                </body>
            </html>
            """
            
            # Send verification email
            email_sent = await send_email(request.recovery_email, "AEGIS - Added as Recovery Contact", html_content)
            
            if email_sent:
                # Update user's recovery email
                user["recovery_email"] = request.recovery_email
                save_users()
                
                return {
                    "message": "Recovery email added successfully. Verification email sent.",
                    "recovery_email": request.recovery_email
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to send verification email. Please check your SMTP configuration.")
    
    raise HTTPException(status_code=401, detail="User not found")

@app.put("/auth/profile")
async def update_profile(request: ProfileUpdateRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update user profile"""
    token = credentials.credentials
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = tokens_db[token]
    
    # Find and update user
    for email, user in users_db.items():
        if user["id"] == user_id:
            # Handle password change if both current and new passwords provided
            if request.current_password and request.new_password:
                # Verify current password
                if hash_password(request.current_password) != user["hashed_password"]:
                    raise HTTPException(status_code=400, detail="Current password is incorrect")
                
                # Update password
                user["hashed_password"] = hash_password(request.new_password)
            
            # Validate and update phone if provided
            if request.phone is not None:
                if request.phone and not validate_phone(request.phone):
                    raise HTTPException(status_code=400, detail="Invalid phone number format")
                if request.phone and not is_phone_unique(request.phone, exclude_current=user.get("phone")):
                    raise HTTPException(status_code=400, detail="Phone number already in use")
                user["phone"] = request.phone or None
            
            # Validate and update recovery email if provided
            if request.recovery_email is not None:
                if request.recovery_email and not validate_email(request.recovery_email):
                    raise HTTPException(status_code=400, detail="Invalid recovery email format")
                user["recovery_email"] = request.recovery_email or None
            
            # Validate and update alternate contact if provided
            if request.alternate_contact is not None:
                if request.alternate_contact and not validate_email(request.alternate_contact):
                    raise HTTPException(status_code=400, detail="Invalid alternate contact email format")
                user["alternate_contact"] = request.alternate_contact or None
            
            # Update name if provided
            if request.name is not None:
                user["name"] = request.name
            
            # Save changes
            save_users()
            
            return {
                "message": "Profile updated successfully",
                "user": {
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
            }

@app.post("/auth/send-verification-code")
async def send_verification_code(request: VerificationCodeRequest):
    """Send 6-digit verification code to email"""
    email = request.email.lower().strip()
    
    # Check if email exists (either primary or recovery)
    user_found = None
    for user_email, user_data in users_db.items():
        if user_email == email or user_data.get("recovery_email") == email:
            user_found = user_data
            break
    
    if not user_found:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a verification code will be sent"}
    
    # Generate and store verification code
    code = generate_verification_code()
    verification_codes_db[email] = {
        "code": code,
        "created_at": datetime.now().isoformat(),
        "attempts": 0
    }
    save_verification_codes()
    
    # Send verification email
    html_content = f"""
    <html>
        <body>
            <h2>AEGIS Password Reset Code</h2>
            <p>Hello,</p>
            <p>Your verification code is: <strong style="font-size: 24px; color: #007bff;">{code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <br>
            <p>Best regards,<br>AEGIS Team</p>
        </body>
    </html>
    """
    
    # Send email
    email_sent = await send_email(email, "AEGIS - Password Reset Code", html_content)
    
    if email_sent:
        return {
            "message": "Verification code sent successfully",
            "expires_in": "10 minutes"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send verification email")

@app.post("/auth/verify-code")
async def verify_code(request: VerifyCodeRequest):
    """Verify 6-digit code"""
    email = request.email.lower().strip()
    code = request.code.strip()
    
    if email not in verification_codes_db:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    stored_data = verification_codes_db[email]
    
    # Check if code matches
    if stored_data["code"] != code:
        stored_data["attempts"] += 1
        save_verification_codes()
        
        if stored_data["attempts"] >= 3:
            # Remove code after 3 failed attempts
            del verification_codes_db[email]
            save_verification_codes()
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new code.")
        
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check if code is expired (10 minutes)
    created_at = datetime.fromisoformat(stored_data["created_at"])
    if datetime.now() - created_at > timedelta(minutes=10):
        del verification_codes_db[email]
        save_verification_codes()
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    # Code is valid
    return {
        "message": "Code verified successfully",
        "email": email
    }

@app.post("/auth/reset-password-with-code")
async def reset_password_with_code(request: ResetPasswordWithCodeRequest):
    """Reset password using verified code"""
    email = request.email.lower().strip()
    code = request.code.strip()
    new_password = request.new_password
    
    # Verify code again (double security)
    if email not in verification_codes_db:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    stored_data = verification_codes_db[email]
    if stored_data["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check if code is expired
    created_at = datetime.fromisoformat(stored_data["created_at"])
    if datetime.now() - created_at > timedelta(minutes=10):
        del verification_codes_db[email]
        save_verification_codes()
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    # Find user and update password
    user_found = False
    for user_email, user_data in users_db.items():
        if user_email == email or user_data.get("recovery_email") == email:
            # Hash new password
            hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
            user_data["hashed_password"] = hashed_password
            user_found = True
            break
    
    if not user_found:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Remove verification code after successful use
    del verification_codes_db[email]
    save_verification_codes()
    save_users()
    
    return {
        "message": "Password reset successfully",
        "email": email
    }

# AI/Detection endpoints
@app.post("/detect/objects")
async def detect_objects(file: UploadFile = File(...)):
    """Detect objects in uploaded image"""
    if not yolo_model:
        raise HTTPException(status_code=500, detail="AI model not loaded")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Run YOLO detection
        results = yolo_model(image_array)
        
        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    detections.append({
                        "class": yolo_model.names[class_id],
                        "confidence": float(confidence),
                        "bbox": [float(x1), float(y1), float(x2), float(y2)]
                    })
        
        return {"detections": detections, "total": len(detections)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": yolo_model is not None
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
