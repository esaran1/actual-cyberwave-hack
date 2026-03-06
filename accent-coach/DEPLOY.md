# Deploy FrontlineReady: Netlify + Koyeb

## 1. Deploy backend to Koyeb

### Prerequisites
- GitHub repo with your code pushed
- [Koyeb account](https://app.koyeb.com) (free, no payment method required)

### Steps

1. **Sign up** at [app.koyeb.com](https://app.koyeb.com)

2. **Create a new service**
   - Click **Create App** or **New Service**
   - Choose **GitHub** as the deployment source
   - Connect GitHub and authorize Koyeb
   - Select your repository

3. **Configure the build**
   - **Builder** section → **Override** the Work directory
   - **Work directory:** `accent-coach/api` (this tells Koyeb your app lives in that subfolder)
   - **Build type:** Dockerfile
   - **Dockerfile path:** `Dockerfile.fly` (relative to the work directory)

4. **Set environment variables** (optional but recommended)
   - `WHISPER_MODEL` = `tiny`
   - `WHISPER_COMPUTE_TYPE` = `int8`

5. **Port**
   - Set the port to **8000** (or whatever your app uses)

6. **Deploy**
   - Click **Deploy** and wait for the build to finish

7. **Copy your backend URL**
   - You'll get a URL like `https://your-app-name-xxx.koyeb.app`
   - Test it: `curl https://your-app-name-xxx.koyeb.app/api/health` → should return `{"ok":true}`

---

## 2. Deploy frontend to Netlify

### Prerequisites
- GitHub repo with your code
- [Netlify account](https://app.netlify.com)

### Steps

1. **Create a new site**
   - Go to [Netlify Dashboard](https://app.netlify.com) → Add new site → Import an existing project
   - Connect GitHub and select your repo

2. **Configure build**
   - **Branch:** main (or your default)
   - **Base directory:** `accent-coach`
   - **Build command:** `cd accent-coach/web && npm install && npm run build`
   - **Publish directory:** leave blank (Next.js plugin handles it)

3. **Add Next.js plugin**
   - Site configuration → Build & deploy → Plugins
   - Add `@netlify/plugin-nextjs` (Essential Next.js)

4. **Set environment variable**
   - Site configuration → Environment variables
   - Add: `NEXT_PUBLIC_API_BASE` = `https://your-app-name-xxx.koyeb.app` (your Koyeb backend URL)

5. **Deploy**
   - Trigger deploy and wait for it to complete

---

## 3. Done

- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-app.koyeb.app`
- CORS is configured to allow `*.netlify.app` and `*.koyeb.app`

---

## Koyeb: Work directory

In the **Builder** section, enable **Override** for **Work directory** and set it to:

```
accent-coach/api
```

This makes Koyeb build from the API folder. The `Dockerfile.fly` is in that folder, so the Dockerfile path is `Dockerfile.fly`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Koyeb: Build fails | Check Dockerfile path and build context; ensure `accent-coach/api` contains the code |
| Koyeb: Out of memory | Upgrade to a larger instance in Koyeb settings |
| Netlify: Build fails | Verify base directory, build command, and Next.js plugin |
| CORS errors | Ensure `NEXT_PUBLIC_API_BASE` matches your Koyeb URL exactly |
| Cold start | Koyeb may sleep when idle; first request can take 30–60s |
