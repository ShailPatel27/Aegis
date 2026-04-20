# AEGIS Web Monitor Deployment

This repo is prepared for:

- **Backend hosting** (FastAPI)
- **Frontend hosting** (Vite React SPA)

## Option A: Docker Compose (recommended baseline)

From `Aegis Web Monitor`:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Services:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Backend environment

Copy and edit:

```bash
cp backend/.env.example backend/.env
```

Required:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SECRET_KEY`
- `USER_EMAIL`, `USER_PASS`, `SMTP_HOST`, `SMTP_PORT` (for alert emails)

Production CORS:

- Set `CORS_ORIGINS` as a comma-separated list:
  - Example: `https://monitor.example.com,https://www.monitor.example.com`

## Frontend environment

Use:

- `frontend/.env.production.example`

Set:

- `VITE_BACKEND_URL=https://your-backend-domain.com`

For Docker build, this is passed through build arg in `docker-compose.prod.yml`.

## Notes

- Frontend nginx config supports SPA routes (`/monitor/*`, `/camera/*`) via fallback to `index.html`.
- High-severity email notifications are sent from backend SMTP config.

