# 🚀 Deployment Guide for ProjectForge

This guide walks you through deploying ProjectForge for free with production-ready scalability.

---

## 🏗️ Architecture Overview

| Component | Technology | Best Platform | Why? |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind | **Vercel** | Free global Edge CDN, instant preview deployments, zero config SPA routing. |
| **Backend** | Python 3.12, FastAPI, SQLite / Postgres, Scikit-Learn | **Render** or **Railway** | Persistent web service with free SSL, native Python 3.12 runtime, and capacity for ML models. |

---

## ⚡ Step 1: Deploy Backend on Render (3 minutes)

Render provides a free web service tier that runs the FastAPI backend persistently with automated database seeding (419 projects).

### Option A: 1-Click Blueprint (Fastest)
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in with your GitHub account.
2. Click **New +** → **Blueprint**.
3. Connect your repository (`saurabhdotdev/Projectrecommender`).
4. Select the branch: `development` (or `main`).
5. Render detects [`render.yaml`](./render.yaml) automatically:
   - Sets runtime to **Python 3.12**.
   - Sets root directory to **`backend`**.
   - Sets build command to **`pip install -r requirements.txt`**.
   - Sets start command to **`uvicorn app.main:app --host 0.0.0.0 --port $PORT`**.
6. Set your environment variable:
   - `GROQ_API_KEY`: *(Your Groq API key for AI Copilot, Mock Interviews & Resume Parsing)*
7. Click **Apply**.
8. Once deployed, Render will provide your public URL:
   `https://projectforge-backend-xxxx.onrender.com`
9. Test your backend: visit `https://projectforge-backend-xxxx.onrender.com/health` in your browser. You should see:
   ```json
   {"status": "healthy", "system": "ProjectForge API", "version": "1.0.0"}
   ```

---

## ⚡ Step 2: Deploy Frontend on Vercel (2 minutes)

1. Go to **[vercel.com](https://vercel.com/)** and log in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `saurabhdotdev/Projectrecommender`.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `frontend` (or leave default root as [`vercel.json`](./vercel.json) handles both).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_BASE`
   - **Value**: `https://projectforge-backend-xxxx.onrender.com` *(your deployed Render backend URL from Step 1)*
6. Click **Deploy**.
7. Vercel will build and launch your site in ~30 seconds with a free `.vercel.app` domain!

---

## 🐳 Alternative: Local or Self-Hosted Docker Deployment

If you want to run both backend, frontend, and a dedicated PostgreSQL database in containers:

```bash
# Clone the repository
git clone https://github.com/saurabhdotdev/Projectrecommender.git
cd Projectrecommender

# Launch all containers
docker-compose up --build
```
- Frontend will be live at `http://localhost:3000`
- Backend API will be live at `http://localhost:8000`
- API interactive docs at `http://localhost:8000/docs`
