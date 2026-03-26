@echo off
echo Starting AEGIS Backend Server (Modular Architecture)...
echo.

REM Kill any existing processes on port 8000
echo Cleaning up port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting modular server...
python main.py

pause
