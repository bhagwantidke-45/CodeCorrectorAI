# CleanCoder AI — Deployment Guide

## Frontend Deployment (Firebase Hosting)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Build the React App
```bash
cd client
cp .env.example .env
# Edit .env — set VITE_API_URL to your deployed backend URL
npm run build
```

### 3. Deploy to Firebase Hosting
```bash
cd ..  # back to cleancoder root
firebase init hosting
# Select: Use existing project → your Firebase project
# Public directory: client/dist
# Configure as SPA: Yes
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

---

## Backend Deployment (Render — Recommended)

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial CleanCoder AI"
git push origin main
```

### 2. Deploy on Render
1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add all environment variables from `server/.env.example`
5. Deploy

### 3. Update Frontend API URL
After backend deploys, update `client/.env`:
```
VITE_API_URL=https://your-app.onrender.com/api
```
Rebuild and redeploy frontend.

---

## Backend Deployment (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set **Root Directory** to `server`
3. Add environment variables
4. Railway auto-detects Node.js and deploys

---

## MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (for cloud deployment)
5. Get connection string → paste in `MONGO_URI`

---

## Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (production mode)
4. Go to Project Settings → Service Accounts → Generate new private key
5. Copy values to `server/.env`:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@...iam.gserviceaccount.com
   ```
6. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → Create API Key
3. Paste into `GEMINI_API_KEY` in your server `.env`

---

## Environment Checklist

### Server
- [ ] `MONGO_URI` — MongoDB Atlas connection string
- [ ] `JWT_SECRET` — Random 32+ character string
- [ ] `GEMINI_API_KEY` — Google AI Studio key
- [ ] `FIREBASE_PROJECT_ID` — Firebase project ID
- [ ] `FIREBASE_PRIVATE_KEY` — Service account private key
- [ ] `FIREBASE_CLIENT_EMAIL` — Service account email
- [ ] `CLIENT_URL` — Frontend URL for CORS

### Client
- [ ] `VITE_API_URL` — Backend API URL

---

## Making First Admin User

After your first registration, promote to admin:
```bash
# Using MongoDB Atlas Data Explorer, or:
mongosh "your-connection-string"
use cleancoder
db.users.updateOne({ email: "admin@yourdomain.com" }, { $set: { role: "admin" } })
```
