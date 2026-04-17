"""
Application Configuration
"""

import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings"""

    # =========================
    # Server Configuration
    # =========================
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    API_URL: str = os.getenv("API_URL", "http://localhost:8000")

    APP_NAME: str = os.getenv("APP_NAME", "AEGIS Vision System")
    VERSION: str = os.getenv("VERSION", "1.0.0")

    # =========================
    # Security Configuration
    # =========================
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # =========================
    # Supabase Configuration
    # =========================
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

    # =========================
    # CORS Configuration
    # =========================
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://matriarch-unicycle-upfront.ngrok-free.dev",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # =========================
    # AI Model Configuration
    # =========================
    YOLO_MODEL_PATH: str = os.getenv("MODEL_PATH", "models/yolov8n.pt")
    EMBEDDINGS_PATH: str = os.getenv("EMBEDDINGS_PATH", "embeddings/")

    # =========================
    # Camera Node Configuration
    # =========================
    CAMERA_RECOGNITION_THRESHOLD: float = float(
        os.getenv("CAMERA_RECOGNITION_THRESHOLD", "0.5")
    )

    CAMERA_DETECTION_THRESHOLD: float = float(
        os.getenv("CAMERA_DETECTION_THRESHOLD", "0.6")
    )

    CAMERA_ALERT_COOLDOWN_SECONDS: int = int(
        os.getenv("CAMERA_ALERT_COOLDOWN_SECONDS", "30")
    )

    MAX_CAMERAS_PER_ACCOUNT: int = int(
        os.getenv("MAX_CAMERAS_PER_ACCOUNT", "5")
    )

    # =========================
    # Email Configuration
    # =========================
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))

    USER_EMAIL: Optional[str] = os.getenv("USER_EMAIL")
    USER_PASS: Optional[str] = os.getenv("USER_PASS")

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # =========================
    # File Upload Configuration
    # =========================
    MAX_FILE_SIZE: int = int(
        os.getenv("MAX_FILE_SIZE", str(10 * 1024 * 1024))
    )  # 10MB

    ALLOWED_EXTENSIONS: List[str] = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    ]

    # =========================
    # Validation
    # =========================
    def validate(self):
        """Validate required environment variables"""

        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_KEY",
            "SECRET_KEY"
        ]

        missing = [
            var for var in required_vars
            if not getattr(self, var)
        ]

        if missing:
            raise ValueError(
                f"Missing required environment variables: {missing}"
            )


# Settings instance
settings = Settings()