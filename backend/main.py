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

# Load environment variables
load_dotenv()

# Global variables for models
yolo_model = None

# In-memory storage for demo purposes (no database)
users_db = {}
tokens_db = {}

# File-based persistence
import json
import os

USER_DB_FILE = "users.json"

def load_users():
    """Load users from file"""
    global users_db
    if os.path.exists(USER_DB_FILE):
        try:
            with open(USER_DB_FILE, 'r') as f:
                users_db = json.load(f)
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
                "created_at": datetime.now().isoformat()
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_users()
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

# Auth endpoints
@app.post("/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(request.password)
    user_id = secrets.token_urlsafe(16)
    users_db[request.email] = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "user_type": request.user_type,
        "hashed_password": hashed_password,
        "created_at": datetime.now().isoformat()
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
                "camera_id": user.get("camera_id")
            }
    
    raise HTTPException(status_code=401, detail="User not found")

@app.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    token = credentials.credentials
    if token in tokens_db:
        del tokens_db[token]
    
    return {"message": "Logged out successfully"}

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
