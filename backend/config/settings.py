"""
Application Configuration
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))  # Changed to 8001 to avoid conflict
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ]
    
    # Database Configuration
    USERS_DB_FILE: str = "users.json"
    VERIFICATION_CODES_FILE: str = "verification_codes.json"
    PROFILES_DB_FILE: str = "profiles.json"
    
    # AI Model Configuration
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    EMBEDDINGS_PATH: str = os.getenv("EMBEDDINGS_PATH", "embeddings/")
    
    # Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    USER_EMAIL: str = os.getenv("USER_EMAIL", "")
    USER_PASS: str = os.getenv("USER_PASS", "")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    # AI Configuration
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    IOU_THRESHOLD: float = float(os.getenv("IOU_THRESHOLD", "0.4"))
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get database URL based on environment"""
        return os.getenv("DATABASE_URL", f"sqlite:///./{cls.USERS_DB_FILE}")

# Settings instance
settings = Settings()
