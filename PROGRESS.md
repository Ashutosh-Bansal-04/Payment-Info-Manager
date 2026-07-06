# PROGRESS.md — Payment Info Manager Build Log

---

## Step 1: Project Scaffolding — 2026-07-06

**What I built:**
- Created the monorepo folder structure: `backend/` and `frontend/` inside `payment-info-manager/`.
- **Backend:** Initialized with `npm init`, installed core dependencies (`express`, `mongoose`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`) and dev dependency (`nodemon`). Set up the source folder layout (`src/config`, `src/controllers`, `src/middleware`, `src/models`, `src/routes`, `src/utils`). Created `src/server.js` (Express entry point with CORS, JSON parsing, health-check route) and `src/config/db.js` (Mongoose connection helper). Added `.env` / `.env.example`.
- **Frontend:** Scaffolded with `npx create-vite@latest` using the `react` template (JavaScript). Installed all default Vite + React dependencies.
- **Root:** Created `README.md` (project overview & setup guide), `PROGRESS.md` (this file), and `.gitignore` (Node + React + env + OS + IDE patterns). Initialized a git repository.

**Why:**
- *Monorepo with separate `backend`/`frontend` dirs* keeps concerns cleanly separated while letting us share a single git history and a unified build log.
- *Vite over CRA* because Vite is faster (native ES modules, on-demand compilation) and the de-facto standard for new React projects.
- *Express + Mongoose* is the most straightforward Node stack for a CRUD-style REST API backed by MongoDB; Mongoose gives us schema validation and middleware hooks out of the box.
- *bcryptjs (pure-JS)* chosen over `bcrypt` (native C++ addon) to avoid native build toolchain issues on Windows/CI.
- *jsonwebtoken* is the standard library for signing/verifying JWTs in Node.
- *nodemon* for hot-reload during backend development.
- *Root-level `.gitignore`* covers both sub-projects so we don't need duplicate ignore files.

**Key files:**
```
payment-info-manager/
├── .gitignore
├── README.md
├── PROGRESS.md
├── backend/
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── src/
│       ├── server.js
│       └── config/db.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        └── App.jsx
```

---

## Step 2: Express Server Setup — 2026-07-06

**What I built:**
- Refined `src/server.js`: health endpoint now returns exactly `{ status: "ok" }`, added `.catch()` on the startup chain so a MongoDB connection failure exits cleanly with a log message instead of an unhandled promise rejection.
- Verified all pieces from Step 1 still match requirements: `src/config/db.js` (Mongoose connect), `.env.example` (placeholder vars), `package.json` scripts (`dev` → nodemon, `start` → node), all dependencies installed.

**Why — folder structure separation of concerns:**
The `backend/src/` directory follows an **MVC-inspired layered architecture**:

| Folder          | Responsibility |
|-----------------|---------------|
| `config/`       | App-wide configuration (DB connection, env parsing). Isolated so connection logic is reusable and testable independently of Express. |
| `models/`       | Mongoose schemas & model definitions. One file per resource keeps the data layer self-documenting and easy to validate. |
| `controllers/`  | Business logic for each route group. Separating controllers from routes means routes stay thin (just HTTP verb + path → handler) while controllers hold the actual logic, making both easier to test. |
| `routes/`       | Express Router definitions that map URL paths to controller functions. Thin by design — they don't import Mongoose directly. |
| `middleware/`   | Cross-cutting concerns (auth verification, error handling, request validation). Placed here so any route can `use()` them without circular dependencies. |
| `utils/`        | Pure helper functions (token generation, response formatters). No Express or Mongoose imports — just portable JS. |

This structure means each layer depends only on the layer below it (`routes → controllers → models → config`), making the codebase easy to navigate, test in isolation, and scale as new payment types are added.

**Key files:**
```
backend/src/
├── server.js          ← refined: exact health response, graceful startup error handling
├── config/db.js       ← unchanged (verified)
├── controllers/       ← empty, ready for auth & payment controllers
├── middleware/         ← empty, ready for auth middleware
├── models/            ← empty, ready for User & PaymentMethod schemas
├── routes/            ← empty, ready for auth & payment routes
└── utils/             ← empty, ready for token helpers
```

---

## Step 3: Authentication (JWT + bcrypt) — 2026-07-06

**What I built:**
- **`models/User.js`** — Mongoose schema with `username`, `email` (unique, lowercase), `password` (bcrypt hash), `role` (enum: user/admin, default user), and `timestamps: true`.
- **`controllers/authController.js`** — Two handlers:
  - `register`: validates required fields + email format + min 6-char password → checks for duplicate email → hashes password with bcrypt (10 salt rounds) → creates user → returns JWT + sanitised user (no password field).
  - `login`: validates input → finds user by email → compares password hash → returns JWT + user. Uses a single *"Invalid email or password"* message on failure so an attacker can't enumerate valid emails.
- **`middleware/authMiddleware.js`** — Two guards:
  - `protect`: extracts `Bearer <token>` from `Authorization` header → verifies with `jwt.verify` → loads user from DB (minus password) → attaches to `req.user`. Distinct 401 messages for missing/expired/invalid tokens.
  - `adminOnly`: checks `req.user.role === 'admin'`, returns 403 otherwise. Always used *after* `protect`.
- **`routes/authRoutes.js`** — Thin router mapping `POST /register` and `POST /login` to controller functions.
- **`server.js`** — Mounted auth routes at `/api/auth`.

**Why — security & architectural decisions:**

1. **Passwords are hashed, never stored in plaintext.** If the database is ever compromised (backup leak, injection attack, insider threat), attackers get useless bcrypt hashes instead of real passwords. bcrypt is intentionally slow (cost factor 10 ≈ ~100 ms/hash) which makes brute-force attacks impractical even with modern GPUs. We use `bcryptjs` (pure JS) to avoid native C++ build dependencies.

2. **JWT instead of server-side sessions** because:
   - This app will be a single-page React frontend talking to a stateless REST API — JWTs let the server stay completely stateless (no session store, no sticky sessions).
   - The token is self-contained: the server only needs the `JWT_SECRET` to verify it, which simplifies horizontal scaling (any server instance can validate any request).
   - 7-day expiry balances convenience (users don't have to log in every session) with security (tokens aren't permanent).

3. **`protect` + `adminOnly` middleware pair** — designed for composability:
   - Public routes: no middleware.
   - User routes (e.g. manage own payment methods): `router.use(protect)` — any authenticated user.
   - Admin routes (e.g. list all users, delete any payment): `router.use(protect, adminOnly)` — must be authenticated *and* have `role: "admin"`.
   - This pair will be reused verbatim on `paymentRoutes` and any future admin routes without duplicating auth logic.

**Key files:**
```
backend/src/
├── models/User.js                  ← Mongoose schema (username, email, password hash, role)
├── controllers/authController.js   ← register & login logic
├── middleware/authMiddleware.js     ← protect (JWT verify) & adminOnly (role gate)
├── routes/authRoutes.js            ← POST /register, POST /login
└── server.js                       ← mounted /api/auth
```

---

## Step 4: PaymentMethod Schema (single-collection, conditional validation) — 2026-07-06

**What I built:**
- **`models/PaymentMethod.js`** — Mongoose schema storing all 5 payment types in one collection:
  - Common fields: `user` (ObjectId ref), `paymentType` (enum), `timestamps`.
  - Bank: `accountHolderName`, `accountNumber`, `ifscCode`, `bankName`, `branchName`.
  - Paytm: `paytmNumber` · UPI: `upiId` · PayPal: `paypalEmail` · USDT: `usdtAddress`.
- **Conditional `required` validation** via a `conditionalRequired(type, label)` helper that returns a Mongoose required-function. At validation time, the function checks `this.paymentType` — if it matches, the field is required; otherwise it's optional. Fully documented with inline comments.
- **`toJSON` transform** strips any fields that belong to *other* payment types. A UPI document's JSON will only contain `{ _id, user, paymentType, upiId, createdAt, updatedAt }` — no `accountNumber`, no `paytmNumber`, etc.
- **`FIELDS_BY_TYPE` map** is the single source of truth used by both the validator and the transform, so adding a 6th payment type later means editing one map + adding the schema fields.

**Why — one flexible collection vs. 5 separate collections:**

| Consideration | One collection (chosen ✅) | 5 collections |
|--------------|---------------------------|---------------|
| **Simplicity** | Single model, single CRUD controller, one set of routes | 5 models, 5 controllers, 5 route files — lots of duplication |
| **Admin queries** | `PaymentMethod.find()` returns all methods across all types; easy to filter with `{ paymentType: 'UPI' }` | Must query 5 collections and merge results |
| **Adding a new type** | Add an enum value + fields + one entry in `FIELDS_BY_TYPE` | Create an entire new model/controller/route stack |
| **Schema tightness** | Some fields are `null`/absent on documents where they don't apply (mitigated by conditional required + toJSON transform) | Each collection only has its own fields — perfectly tight |
| **Indexing** | Compound index on `{ user, paymentType }` covers the common query pattern | Each collection only needs `{ user }` |

**Trade-off accepted:** A Bank document will have empty `upiId`/`paytmNumber`/etc. fields at the storage level, but this is negligible overhead (a few null keys) compared to the massive reduction in code duplication. The `toJSON` transform ensures the API consumer never sees these unused fields.

**Key files:**
```
backend/src/
└── models/PaymentMethod.js   ← single-collection schema with conditional validation + toJSON transform
```
