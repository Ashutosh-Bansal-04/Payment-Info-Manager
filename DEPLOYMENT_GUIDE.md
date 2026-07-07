# Deployment Guide

Step-by-step instructions for deploying the Payment Info Manager to production.

---

## Prerequisites

- A [MongoDB Atlas](https://cloud.mongodb.com) account with an active cluster
- A [GitHub](https://github.com) account
- A [Render](https://render.com) account (backend)
- A [Vercel](https://vercel.com) account (frontend)

---

## Step 1: Split into Two Separate GitHub Repos

The task requires two **separate public** repositories. Run these commands from the project root:

### Backend repo

```bash
# Create a new directory for the backend repo
mkdir ../payment-info-manager-backend
cd ../payment-info-manager-backend
git init

# Copy backend files
cp -r ../payment-info-manager/backend/* .
cp -r ../payment-info-manager/backend/.env.example .
cp ../payment-info-manager/.gitignore .

# Commit
git add -A
git commit -m "Initial commit — Payment Info Manager Backend"

# Create repo on GitHub (via browser or gh CLI), then:
git remote add origin https://github.com/<YOUR_USERNAME>/payment-info-manager-backend.git
git branch -M main
git push -u origin main
```

### Frontend repo

```bash
mkdir ../payment-info-manager-frontend
cd ../payment-info-manager-frontend
git init

# Copy frontend files
cp -r ../payment-info-manager/frontend/* .
cp -r ../payment-info-manager/frontend/.env.example .
cp ../payment-info-manager/frontend/vercel.json .
cp ../payment-info-manager/.gitignore .

# Commit
git add -A
git commit -m "Initial commit — Payment Info Manager Frontend"

# Create repo on GitHub, then:
git remote add origin https://github.com/<YOUR_USERNAME>/payment-info-manager-frontend.git
git branch -M main
git push -u origin main
```

> **Important:** Make both repos **Public** in GitHub repo settings.

---

## Step 2: Set Up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a free M0 cluster (or use existing)
2. **Database Access** → create a database user with a username and password
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere) for Render to connect
4. **Connect** → click "Drivers" → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/payment-info-manager?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials

---

## Step 3: Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your **payment-info-manager-backend** GitHub repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `payment-info-manager-api` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `node src/server.js` |
   | **Plan** | Free |

4. Add **Environment Variables** on Render:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string from Step 2 |
   | `JWT_SECRET` | A long random string (run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one) |
   | `PORT` | `10000` (Render's default) |
   | `FRONTEND_URL` | Leave blank for now — you'll fill this after Step 4 |

5. Click **Create Web Service** → wait for build to complete
6. Test: visit `https://your-backend-name.onrender.com/api/health` — should return `{ "status": "ok" }`
7. **Note the URL** — you'll need it for the frontend

> ⚠️ **Free tier cold starts:** Render free tier spins down after 15 minutes of inactivity. The first request after inactivity will take ~30-60 seconds. This is expected.

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your **payment-info-manager-frontend** GitHub repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Add **Environment Variable** on Vercel:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_BASE_URL` | `https://your-backend-name.onrender.com/api` (the Render URL from Step 3) |

5. Click **Deploy** → wait for build
6. **Note the frontend URL** (e.g. `https://payment-info-manager-frontend.vercel.app`)

---

## Step 5: Update Backend CORS with Frontend URL

Go back to **Render dashboard** → your backend service → **Environment** → update:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://payment-info-manager-frontend.vercel.app` (your actual Vercel URL) |

Render will auto-redeploy. This locks CORS to only accept requests from your deployed frontend.

---

## Step 6: Create an Admin User

1. Register a normal user account via the live frontend
2. Open MongoDB Atlas → **Browse Collections** → `payment-info-manager` database → `users` collection
3. Find your user document → click **Edit** → change `role` from `"user"` to `"admin"` → **Save**
4. Log out and log back in on the frontend — the JWT will now carry the admin role

---

## Step 7: Verify Everything Works

Test these flows on the **live URLs**:

- [ ] Register a new account
- [ ] Login with that account
- [ ] Add one payment method of each type (Bank, Paytm, UPI, PayPal, USDT)
- [ ] Edit one entry, refresh, confirm change persisted
- [ ] Delete one entry, refresh, confirm it's gone
- [ ] Log out, confirm protected pages redirect to login
- [ ] Log in as admin, confirm admin panel shows all users' payments
- [ ] Test at least 3 filters in the admin panel
- [ ] Hard-refresh a non-root URL (e.g. `/payments`) — should work, not 404

---

## Quick Reference: All Environment Variables

### Backend (Render)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Random secret for signing JWTs |
| `PORT` | ✅ | `10000` for Render |
| `FRONTEND_URL` | ✅ | Your Vercel frontend URL |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_BASE_URL` | ✅ | Your Render backend URL + `/api` |
