# speech-helper

This repository contains the AccentCoach MVP inside `accent-coach/`.

- Project README: `accent-coach/README.md`
- Docker Compose: `accent-coach/docker-compose.yml`

## Quick start (local)

Backend:
```bash
cd accent-coach/api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:
```bash
cd accent-coach/web
npm install
npm run dev
```

Open `http://localhost:3000`.

