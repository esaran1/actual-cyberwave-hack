# FrontlineReady

FrontlineReady is a friendly pronunciation and communication coach for accented English speakers. Record or upload speech, get faster-whisper transcripts with per-word diagnostics, and listen to targeted example pronunciations generated with Coqui TTS.

## Tech stack
- **Backend:** FastAPI, faster-whisper, ffmpeg, pydub, Coqui TTS
- **Frontend:** Next.js 14 (App Router), TailwindCSS, shadcn/ui, wavesurfer.js, framer-motion, react-dropzone
- **Storage:** Local filesystem under `api/data` (uploads, jobs, clips, TTS assets)

## Local development

### Prerequisites
- Python 3.11+
- Node.js 18+
- ffmpeg (`brew install ffmpeg` on macOS)

### Backend (FastAPI)
```bash
cd accent-coach/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The API listens on `http://localhost:8000` and exposes `/api/health`, `/api/analyze`, `/api/job/{id}`, `/api/audio/{clip_id}`, and `/api/tts/{tts_id}`.

### Frontend (Next.js)
```bash
cd accent-coach/web
npm install
npm run dev
```
Next.js runs on `http://localhost:3000` and calls the FastAPI server via `NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000`).

### Docker Compose
To run both services together:
```bash
cd accent-coach
docker compose up --build
```
The compose file builds the API (with ffmpeg and Python dependencies) and the web app (Next dev server) so you can run the entire stack with one command.

## How it works
1. `POST /api/analyze` accepts an audio upload or processes the bundled sample (`Try demo`).
2. Audio is normalized to mono 16k WAV with ffmpeg, then transcribed with faster-whisper to obtain word timestamps.
3. Each word receives a heuristic pronunciation score, issue label, and tip. User clips are sliced via `pydub`, and Coqui TTS synthesizes comparison audio for flagged words.
4. Job state is tracked in `api/data/jobs/{job_id}.json` so UI polling is reliable.
5. The Next.js UI polls `/api/job/{job_id}` until processing completes, then renders summary cards and a color-coded transcript. Selecting a word opens a dialog with user + coach audio players and the guidance text.

## Sample audio
A bundled sample lives at `api/data/samples/demo.wav`. The landing page "Try demo" button triggers analysis of this sample so you can see results immediately without recording.
