# AEGIS Web Monitor

AEGIS Web Monitor is the web control center for camera streams, alerts, analytics, and face management.

## Components

- `backend/`: FastAPI API (auth, camera routes, monitor routes)
- `frontend/`: React + Vite dashboard

## Features

- Live monitoring and playback
- Alert center with filtering and lifecycle actions
- Analytics dashboards and rollups
- Face recognition/blacklist management
- Camera configuration and account controls
- SMTP email notifications for high-severity alerts (when enabled)

## Local Development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python main.py
```

Backend default URL: `http://localhost:8000`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Production / Hosting

Use the provided deployment guide and docker setup:

- `DEPLOYMENT.md`
- `docker-compose.prod.yml`

Quick start:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Environment

Backend `.env` important values:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SECRET_KEY`
- `CORS_ORIGINS` (comma-separated in production)
- `USER_EMAIL`, `USER_PASS`, `SMTP_HOST`, `SMTP_PORT` (for email alerts)

Frontend production:

- set `VITE_BACKEND_URL` (see `frontend/.env.production.example`)

## Notes

- Frontend nginx config already supports SPA route fallback.
- Monitor settings page controls push/email notification behavior persisted in profile JSON.
