# Deployment Guide (Option A: Firebase Hosting + Cloud Run)

This app deploys the frontend to Firebase Hosting and the backend (Express + Socket.io) to Google Cloud Run. Database remains MongoDB Atlas.

## Prerequisites
- Google Cloud project: `moment-weaver-66582`
- Firebase project: `moment-weaver-66582`
- Node.js and npm installed
- gcloud CLI: https://cloud.google.com/sdk/docs/install
- Firebase CLI: `npm i -g firebase-tools`

## 1) Configure Environment Variables (Backend)
Set these on Cloud Run during deploy:
- `PORT=8080`
- `NODE_ENV=production`
- `FRONTEND_URL=https://moment-weaver-66582.web.app`
- `MONGODB_URI=<YOUR_ATLAS_CONNECTION_STRING>` (ensure it includes `/wedding-timeline` before `?`)
- `JWT_SECRET=<YOUR_SECRET>`

## 2) Deploy Backend to Cloud Run
From the `backend/` folder:

```bash
# Authenticate and set project
gcloud auth login
gcloud config set project moment-weaver-66582

# Enable services
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Build container
gcloud builds submit --tag gcr.io/moment-weaver-66582/wedding-backend

# Deploy to Cloud Run (region: us-central1)
gcloud run deploy wedding-backend \
  --image gcr.io/moment-weaver-66582/wedding-backend \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars PORT=8080,NODE_ENV=production,FRONTEND_URL=https://moment-weaver-66582.web.app \
  --set-env-vars MONGODB_URI='<YOUR_ATLAS_CONNECTION_STRING>' \
  --set-env-vars JWT_SECRET='<YOUR_SECRET>'
```

Copy the service URL (e.g., `https://wedding-backend-xxxx-uc.a.run.app`).

## 3) Deploy Frontend to Firebase Hosting
From the project root:

```bash
# Login and select project
firebase login
firebase use moment-weaver-66582

# Build frontend
cd frontend
npm run build
cd ..

# Deploy hosting
firebase deploy --only hosting
```

Your site will be available at: `https://moment-weaver-66582.web.app`

## 4) API Routing via Hosting Rewrites
The repository includes `firebase.json` with a rewrite:
```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [
      { "source": "/api/**", "run": { "serviceId": "wedding-backend", "region": "us-central1" } },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```
- This proxies requests from the hosted site to Cloud Run at `/api/**`.
- The frontend uses `'/api'` as base URL by default (see `frontend/src/lib/api.ts`).

If you changed service name or region when deploying, update `firebase.json` accordingly and redeploy hosting:
```bash
firebase deploy --only hosting
```

## 5) Verify
- Open `https://moment-weaver-66582.web.app`
- Register/login, create a timeline, add events
- Optional health check (direct to Cloud Run):
```bash
curl https://<YOUR_CLOUD_RUN_DOMAIN>/api/health
```

## 6) Sockets and CORS
- Cloud Run supports WebSockets. `server.js` CORS is driven by `FRONTEND_URL` env var. Ensure it matches Hosting URL.

## Local Development
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`
- Frontend proxies `/api` to `http://localhost:5050` (see `frontend/vite.config.ts`). Set `PORT=5050` in `backend/.env`.

## Troubleshooting
- 401 auth errors in the browser:
  - Clear localStorage token and sign in again.
- 500 errors on registration:
  - Check Atlas URI correctness and IP allowlist (allow 0.0.0.0/0 for development).
- CORS issues:
  - Confirm `FRONTEND_URL` env on Cloud Run equals your Hosting domain.
- Hosting cannot reach backend:
  - Ensure `firebase.json` rewrite `serviceId` and `region` match your Cloud Run service.

## Updating Backend After Changes
From `backend/`:
```bash
gcloud builds submit --tag gcr.io/moment-weaver-66582/wedding-backend

gcloud run deploy wedding-backend \
  --image gcr.io/moment-weaver-66582/wedding-backend \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1
```

## Optional: Use VITE_API_URL Instead of Rewrites
Set during build (not needed if rewrites are enabled):
```bash
cd frontend
VITE_API_URL="https://<YOUR_CLOUD_RUN_DOMAIN>/api" npm run build
firebase deploy --only hosting
```
