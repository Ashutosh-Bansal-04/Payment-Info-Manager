# 💳 Payment Info Manager

A full-stack web application for managing payment information across multiple payment methods. Users can securely store, edit, and delete their payment details (Bank, Paytm, UPI, PayPal, USDT), while admins can search and filter across all users' payment data.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|------------------------------------------------|
| **Frontend** | React 19 (Vite), React Router v7, Axios, plain CSS |
| **Backend**  | Node.js, Express.js, Mongoose ODM              |
| **Database** | MongoDB (local or Atlas)                        |
| **Auth**     | JWT (jsonwebtoken) + bcrypt (bcryptjs)          |
| **Security** | Rate limiting (express-rate-limit), centralized error handling, input length caps |

---

## Project Structure

```
payment-info-manager/
├── backend/                          # Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Mongoose connection logic
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register + Login (bcrypt, JWT)
│   │   │   ├── paymentController.js  # CRUD for user's own payment methods
│   │   │   └── adminController.js    # Admin: list/filter all payments
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # protect (JWT verify) + adminOnly
│   │   │   └── errorHandler.js       # Centralized error → JSON response
│   │   ├── models/
│   │   │   ├── User.js               # username, email, password, role
│   │   │   └── PaymentMethod.js      # paymentType + conditional fields
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # POST /register, /login (rate-limited)
│   │   │   ├── paymentRoutes.js      # CRUD /api/payments (protected)
│   │   │   └── adminRoutes.js        # GET /api/admin/payments (admin-only)
│   │   ├── utils/
│   │   │   └── AppError.js           # Custom error class with statusCode
│   │   └── server.js                 # Entry point — mounts everything
│   ├── .env.example                  # Required env vars (no real values)
│   └── package.json
│
├── frontend/                         # React + Vite client
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosClient.js        # Axios instance + JWT interceptor
│   │   │   └── index.js              # All API call functions
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navigation bar
│   │   │   ├── PaymentModal.jsx      # Add/Edit modal with conditional fields
│   │   │   └── ProtectedRoute.jsx    # Client-side auth/admin route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # User/token state + localStorage
│   │   │   └── ToastContext.jsx      # Global toast notification system
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ManagePayments.jsx    # Core screen — card list + CRUD
│   │   │   └── AdminPanel.jsx        # Filter bar + table + pagination
│   │   ├── styles/
│   │   │   ├── global.css            # Design tokens, reset, utilities
│   │   │   ├── auth.css              # Login/Register card styles
│   │   │   ├── payments.css          # Payment cards, modal, chips
│   │   │   ├── admin.css             # Admin table + filter bar
│   │   │   ├── navbar.css            # Top nav bar
│   │   │   └── toast.css             # Toast notifications
│   │   ├── App.jsx                   # React Router setup
│   │   └── main.jsx                  # Entry point
│   ├── .env.example
│   └── package.json
│
├── PROGRESS.md                       # Detailed build log (every step explained)
└── README.md                         # ← You are here
```

---

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** — either running locally (`mongod`) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url> && cd payment-info-manager

# Backend
cd backend
cp .env.example .env     # then edit .env — see "Environment Variables" below
npm install

# Frontend
cd ../frontend
cp .env.example .env     # usually no changes needed for local dev
npm install
```

### 2. Configure environment variables

#### Backend (`backend/.env`)

| Variable     | Description                          | Example                                            |
|-------------|--------------------------------------|----------------------------------------------------|
| `PORT`      | Port the Express server listens on   | `5000`                                             |
| `MONGO_URI` | MongoDB connection string            | `mongodb://localhost:27017/payment-info-manager` or Atlas URI |
| `JWT_SECRET`| Secret key used to sign JWTs         | Any long random string (e.g. `openssl rand -hex 32`) |

#### Frontend (`frontend/.env`)

| Variable             | Description                       | Example                          |
|---------------------|-----------------------------------|----------------------------------|
| `VITE_API_BASE_URL` | Base URL of the backend API       | `http://localhost:5000/api`      |

> **Note:** Vite requires frontend env vars to be prefixed with `VITE_` to be exposed to client code.

### 3. Run in development

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → Server running on http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev
# → Vite dev server on http://localhost:5173
```

### 4. Create an admin user

Register a user normally, then manually update their role in MongoDB:

```js
// In mongosh or MongoDB Compass:
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path                | Description                          | Auth Required |
|--------|---------------------|--------------------------------------|:---:|
| `POST` | `/api/auth/register` | Create a new user account, returns JWT | No |
| `POST` | `/api/auth/login`    | Authenticate with email + password, returns JWT | No |

> Both routes are **rate-limited**: register 10 req/15min, login 20 req/15min per IP.

### Payments (`/api/payments`) — requires JWT

| Method   | Path                   | Description                              |
|----------|------------------------|------------------------------------------|
| `POST`   | `/api/payments`        | Add a new payment method                 |
| `GET`    | `/api/payments`        | Get all payment methods for the logged-in user (newest first) |
| `PUT`    | `/api/payments/:id`    | Update a payment method (ownership check enforced) |
| `DELETE` | `/api/payments/:id`    | Delete a payment method (ownership check enforced) |

### Admin (`/api/admin`) — requires JWT + admin role

| Method | Path                    | Description                                              |
|--------|-------------------------|----------------------------------------------------------|
| `GET`  | `/api/admin/payments`   | List all payments across all users (with filters + pagination) |

**Supported query params for filtering:**

| Param         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `username`    | string | Partial match on user's username |
| `paymentType` | string | Exact match: `Bank`, `Paytm`, `UPI`, `PayPal`, `USDT` |
| `bankName`    | string | Partial match (case-insensitive) |
| `ifscCode`    | string | Partial match                  |
| `paytmNumber` | string | Partial match                  |
| `upiId`       | string | Partial match                  |
| `paypalEmail` | string | Partial match                  |
| `usdtAddress` | string | Partial match                  |
| `page`        | number | Page number (default: 1)       |
| `limit`       | number | Results per page (default: 20, max: 100) |

### Health Check

| Method | Path           | Description        |
|--------|----------------|--------------------|
| `GET`  | `/api/health`  | Returns `{ status: "ok" }` |

---

## Payment Types & Fields

| Type   | Required Fields                                               |
|--------|---------------------------------------------------------------|
| Bank   | `ifscCode`, `branchName`, `bankName`, `accountNumber`, `accountHolderName` |
| Paytm  | `paytmNumber`                                                 |
| UPI    | `upiId`                                                       |
| PayPal | `paypalEmail`                                                 |
| USDT   | `usdtAddress`                                                 |

All stored in a single MongoDB collection with conditional validation per `paymentType`.

---

## Deployment

### Backend → [Render](https://render.com) or [Railway](https://railway.app) (recommended)

Both platforms support long-running Node.js servers with persistent connections to MongoDB.

1. Push the `backend/` directory (or the whole repo).
2. Set the **build command** to `npm install` and the **start command** to `node src/server.js`.
3. Set environment variables on the platform dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random secret
   - `PORT` — usually auto-set by the platform (Render uses `10000`, Railway uses a dynamic port)
4. The platform will give you a public URL like `https://your-backend.onrender.com`.

> **Why not Vercel for the backend?** Vercel deploys as serverless functions, which means each request cold-starts a new process. Express + Mongoose works best as a long-running server with persistent DB connections — Render/Railway handle this natively.

### Frontend → [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (recommended)

Both are optimised for static site / SPA deployments.

1. Push the `frontend/` directory.
2. Set the **build command** to `npm run build` and the **publish directory** to `dist`.
3. Set the environment variable:
   - `VITE_API_BASE_URL` — the public URL of your deployed backend (e.g. `https://your-backend.onrender.com/api`)
4. Add a **rewrite rule** so all routes fall back to `index.html` (needed for client-side routing):
   - **Netlify**: create `frontend/public/_redirects` with `/* /index.html 200`
   - **Vercel**: add `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` in `vercel.json`

### Environment variables summary for deployment

| Platform  | Variable             | Value                                    |
|-----------|---------------------|------------------------------------------|
| Backend   | `MONGO_URI`         | MongoDB Atlas connection string          |
| Backend   | `JWT_SECRET`        | Long random secret                       |
| Backend   | `PORT`              | Usually auto-set by platform             |
| Frontend  | `VITE_API_BASE_URL` | `https://<your-backend-url>/api`         |

---

## Known Limitations

See [PROGRESS.md — Step 11](PROGRESS.md) for a detailed table of production limitations including: no email verification, no refresh tokens, no password reset flow, no HTTPS enforcement, no security headers (helmet), no automated tests, in-memory rate limiting, and potential ReDoS in admin regex filters.

---

## License

ISC
