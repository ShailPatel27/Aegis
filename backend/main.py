"""
AEGIS Backend - Modular Architecture
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import socket

from config.settings import settings
from auth.routes import router as auth_router
from camera.stream import router as camera_router

def is_port_available(port: int) -> bool:
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result != 0
    except Exception:
        return False


def get_available_port() -> int:
    """Get available port (prefer 8000, fallback to 8001)"""
    if is_port_available(8000):
        return 8000
    elif is_port_available(8001):
        return 8001
    else:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = s.getsockname()[1]
        return port


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 AEGIS Backend Started Successfully")
    yield
    print("🛑 AEGIS Backend Shutting Down")


# FastAPI App
app = FastAPI(
    title="AEGIS Vision System API",
    description="Modular Security & AI Application",
    version="0.1.0",
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
app.include_router(camera_router, prefix="/api/camera")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AEGIS Backend",
        "version": "0.1.0"
    }


if __name__ == "__main__":
    try:
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