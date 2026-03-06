# Deploy FrontlineReady on Replit

Replit hosts both backend and frontend in one project. No credit card required.

---

## Steps

### 1. Push your code to GitHub

Make sure your repo is on GitHub with the latest changes.

### 2. Create a Replit from GitHub

1. Go to [replit.com](https://replit.com) and sign up or log in.
2. Click **Create Repl**.
3. Choose **Import from GitHub**.
4. Connect GitHub and select your repository (e.g. `actual-cyberwave-hack` or your repo name).
5. Click **Import from GitHub**.

### 3. Configure the Repl

Replit will use the included config:

- **`.replit`** – Run command: `bash run.sh`
- **`replit.nix`** – Adds ffmpeg and Node.js
- **`run.sh`** – Starts the backend, then the frontend

### 4. Run the app

1. Click **Run** (or press Ctrl+Enter).
2. Wait for the build (first run may take a few minutes).
3. When it’s ready, Replit will show the Webview.
4. Your app URL will look like: `https://YourReplName--YourUsername.repl.co`

### 5. Enable “Always On” (optional)

- Free repls sleep when idle.
- Go to the Repl’s **Tools** → **Deploy** and enable **Always On** if you have Replit Premium, or use the app regularly to keep it awake.

---

## How it works

- **Backend** (FastAPI): Runs on port 8000.
- **Frontend** (Next.js): Runs on port 3000 and is exposed by Replit.
- **API proxy**: Next.js forwards `/api/*` to the backend, so one public URL is enough.
- **Whisper**: Uses the `tiny` model to fit Replit’s free tier.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check the Shell/Console for errors. Ensure `accent-coach/api` and `accent-coach/web` exist. |
| “Module not found” | Run `pip install -r accent-coach/api/requirements-fly.txt` in the Shell, then Run again. |
| Out of memory | Replit free tier has limits. Whisper `tiny` is used to reduce memory use. |
| Sleep/cold start | Free repls sleep when idle. First load after sleep can take 30–60 seconds. |

---

## File layout

```
your-repo/
├── .replit          # Replit run config
├── replit.nix       # System deps (ffmpeg, node)
├── run.sh           # Starts backend + frontend
├── accent-coach/
│   ├── api/
│   └── web/
└── ...
```
