"""
AEGIS Backend - Modular Architecture
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import socket
from config.settings import settings
from database.models import db
from auth.routes import router as auth_router

def is_port_available(port: int) -> bool:
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result != 0
    except:
        return False

def get_available_port() -> int:
    """Get available port (prefer 8000, fallback to 8001)"""
    if is_port_available(8000):
        return 8000
    elif is_port_available(8001):
        return 8001
    else:
        # Find another available port
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = s.getsockname()[1]
        return port

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.load_all_data()
    print("🚀 AEGIS Backend Started Successfully")
    print(f"📊 Database loaded: {len(db.users_db)} users, {len(db.verification_codes_db)} codes, {len(db.profiles_db)} profiles")
    yield
    # Shutdown
    db.save_all_data()
    print("🛑 AEGIS Backend Shutting Down")

# FastAPI App
app = FastAPI(
    title="AEGIS Vision System API",
    description="Modular Security & AI Application",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": db.load_all_data.__dict__.get('timestamp', 'unknown'),
        "version": "2.0.0",
        "modules": {
            "users": len(db.users_db),
            "verification_codes": len(db.verification_codes_db),
            "profiles": len(db.profiles_db)
        }
    }

if __name__ == "__main__":
    try:
        # Get available port
        port = get_available_port()
        print(f"🌐 Starting AEGIS Server on {settings.HOST}:{port}")
        print(f"🔗 API Documentation: http://localhost:{port}/docs")
        
        uvicorn.run(
            app,
            host=settings.HOST,
            port=port,
            reload=settings.DEBUG
        )
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
