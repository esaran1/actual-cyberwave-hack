#!/bin/bash
set -e

# Start backend in background
cd accent-coach/api
pip install -q -r requirements-fly.txt 2>/dev/null || pip install -q -r requirements.txt 2>/dev/null || true
export WHISPER_MODEL=tiny
export WHISPER_COMPUTE_TYPE=int8
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend (main server - Replit exposes this port)
cd ../web
export NEXT_PUBLIC_API_BASE=""
export REPLIT=1
npm install --silent 2>/dev/null
npm run build 2>/dev/null
export PORT=${PORT:-3000}
npm run start -- -p $PORT

# If frontend exits, kill backend
kill $BACKEND_PID 2>/dev/null || true
