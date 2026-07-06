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

---

## Step 5: Payment CRUD API (ownership-checked) — 2026-07-06

**What I built:**
- **`controllers/paymentController.js`** — four handlers:
  - `addPaymentMethod` — validates `paymentType` + its required fields (via a `FIELDS_BY_TYPE` mirror of the model's map), then creates the doc with `user: req.user._id` (always set server-side, never from the client).
  - `getMyPaymentMethods` — `find({ user: req.user._id })` sorted by `createdAt: -1` (newest first).
  - `updatePaymentMethod` — finds by `_id`, ownership-checks, validates if type is changing, then `Object.assign` + `save()` to trigger Mongoose validation.
  - `deletePaymentMethod` — finds by `_id`, ownership-checks, then `deleteOne()`.
- **`routes/paymentRoutes.js`** — thin router with `router.use(protect)` applied once at the top:
  - `POST /` · `GET /` · `PUT /:id` · `DELETE /:id`
- **`server.js`** — mounted at `/api/payments`.

**Why — the ownership-check pattern:**

Every `update` and `delete` follows the same two-step pattern:
```
1. const method = await PaymentMethod.findById(req.params.id);  // find the doc
2. if (method.user.toString() !== req.user._id.toString()) → 403
```

**Why this matters for security:**
- The `protect` middleware only proves the caller is *some* authenticated user — it does NOT prove they own the specific document they're trying to modify.
- MongoDB ObjectIds are 24-character hex strings. They're not truly secret — they can be guessed, enumerated, or leaked in logs/URLs.
- Without the ownership check, User A could call `PUT /api/payments/<User-B's-doc-id>` and silently overwrite User B's bank details. This is a classic **Insecure Direct Object Reference (IDOR)** vulnerability (OWASP Top 10).
- The check ensures **authorisation** (are you allowed to touch *this* resource?) on top of **authentication** (are you who you say you are?).
- We return `404` if the doc doesn't exist and `403` if it exists but belongs to someone else. The two distinct codes let the client show the right error without leaking information about other users' data (the 403 only fires after we've confirmed the document exists, and the requesting user is authenticated anyway).

**`user` field is always server-set:** In `addPaymentMethod`, `user: req.user._id` overrides whatever the client sends, so a malicious request body like `{ user: "<someone-else's-id>" }` is harmless.

**Key files:**
```
backend/src/
├── controllers/paymentController.js   ← CRUD + ownership checks
├── routes/paymentRoutes.js            ← POST / GET / PUT / DELETE, all behind protect
└── server.js                          ← mounted /api/payments
```

---

## Step 6: Admin API (filtered, paginated, populate) — 2026-07-06

**What I built:**
- **`controllers/adminController.js`** — `getAllPayments` handler:
  - Returns all `PaymentMethod` documents with `.populate('user', 'username email')` so each result includes the owner's identity.
  - Supports 8 optional query params: `username`, `paymentType`, `bankName`, `ifscCode`, `paytmNumber`, `upiId`, `paypalEmail`, `usdtAddress`.
  - Pagination via `?page=` and `?limit=` (default 20, capped at 100). Response includes `totalPages` and `totalResults`.
- **`routes/adminRoutes.js`** — `GET /payments` behind `protect` + `adminOnly`.
- **`server.js`** — mounted at `/api/admin`.

**Why — dynamic filter-building:**

The controller starts with an empty filter object `{}` and only adds keys for query params that were actually provided:

```js
const filter = {};
if (req.query.paymentType) filter.paymentType = req.query.paymentType;
for (const [param, field] of Object.entries(TEXT_FILTERS)) {
  if (req.query[param]) filter[field] = new RegExp(req.query[param], 'i');
}
```

- **Empty `{}` = match everything** — if the admin hits `/api/admin/payments` with no params, they see all records.
- **Each param narrows** — `?paymentType=UPI&upiId=@oksbi` produces `{ paymentType: 'UPI', upiId: /\@oksbi/i }`.
- **Params compose freely** — any combination works because we're just accumulating keys in one object.
- **`username` is special** — it lives on the `User` model, not `PaymentMethod`, so we first do a `User.find()` to resolve matching user IDs, then add `{ user: { $in: [...] } }` to the filter.
- **Regex `'i'` flag** — case-insensitive partial matching so an admin typing "hdfc" matches "HDFC Bank".

**Why `adminOnly` is stacked on top of `protect`, not replacing it:**

```js
router.use(protect, adminOnly);
```

- `protect` handles **authentication** — it verifies the JWT, loads the user from the DB, and attaches `req.user`. Without it, `req.user` wouldn't exist at all.
- `adminOnly` handles **authorisation** — it reads `req.user.role` and checks for `"admin"`. It *depends* on `protect` having already run.
- If `adminOnly` replaced `protect`, it would have no `req.user` to inspect — it would either crash or need to duplicate all the JWT logic.
- Stacking keeps each middleware single-responsibility and reusable: `protect` alone guards user routes, `protect + adminOnly` guards admin routes, and neither knows about the other's internals.

**Key files:**
```
backend/src/
├── controllers/adminController.js   ← getAllPayments with dynamic filters + populate
├── routes/adminRoutes.js            ← GET /payments behind protect + adminOnly
└── server.js                        ← mounted /api/admin
```

---

## Step 7: Frontend Scaffolding (Vite + React Router + AuthContext) — 2026-07-07

**What I built:**
- **`api/axiosClient.js`** — axios instance with `baseURL` from `VITE_API_BASE_URL` env var, a request interceptor that auto-attaches the JWT from localStorage, and a response interceptor that clears auth + redirects on 401.
- **`api/index.js`** — centralised API call functions (`registerUser`, `loginUser`, `getMyPayments`, `addPayment`, `updatePayment`, `deletePayment`, `getAdminPayments`).
- **`context/AuthContext.jsx`** — React context storing `{ user, token }`. Provides `login()` (saves to state + localStorage) and `logout()` (clears both). Rehydrates from localStorage on mount so page refresh preserves the session.
- **`components/ProtectedRoute.jsx`** — route wrapper that redirects to `/login` if not authenticated, or to `/payments` if `adminOnly` is set and the user isn't an admin.
- **5 pages:** `Login`, `Register`, `Dashboard`, `ManagePayments` (placeholder), `AdminPanel` (placeholder).
- **`styles/global.css`** — design tokens, reset, form styles, button utilities. **`styles/auth.css`** — auth page card layout.
- **`App.jsx`** — React Router v6 with `AuthProvider` wrapping the tree:
  - `/login`, `/register` — public
  - `/dashboard`, `/payments` — `<ProtectedRoute>`
  - `/admin` — `<ProtectedRoute adminOnly>`
  - `*` → redirect to `/login`
- **`.env.example`** — documents `VITE_API_BASE_URL`.

**Why Vite over create-react-app (CRA):**
- **CRA is deprecated** — React no longer recommends it; the maintainers have stopped active development.
- **Vite's dev server is near-instant** — it uses native ES modules and on-demand compilation (esbuild), so hot-module reload is measured in milliseconds, not seconds.
- **Vite's build is faster** — it uses Rollup under the hood with tree-shaking, producing smaller bundles.
- **Active ecosystem** — Vite is maintained by the Vue/Vite team with frequent releases and a growing plugin ecosystem.

**How the ProtectedRoute pattern works (client-side guard):**

```
<Route path="/payments" element={
  <ProtectedRoute>           ←── checks token
    <ManagePayments />       ←── rendered only if auth'd
  </ProtectedRoute>
} />
```

1. ProtectedRoute reads `token` from AuthContext.
2. If `loading` is true (localStorage still rehydrating), it renders nothing — prevents a flash of the login page.
3. If `token` is null, it returns `<Navigate to="/login" state={{ from: location }} />` — the user is bounced to login, and the original URL is saved in router state so we can redirect back after login.
4. If `adminOnly` is true and `user.role !== 'admin'`, it redirects to `/payments`.
5. Otherwise, it renders `children` (the actual page).

⚠️ **This is purely a UX convenience.** The real security is in the backend: if someone crafted a request without a valid JWT, the `protect` middleware would reject it with 401. The ProtectedRoute just prevents the user from seeing a broken page that can't load data.

**Key files:**
```
frontend/src/
├── api/
│   ├── axiosClient.js        ← axios instance + JWT interceptor
│   └── index.js              ← all API call functions
├── context/
│   └── AuthContext.jsx       ← user/token state + login/logout + localStorage
├── components/
│   └── ProtectedRoute.jsx    ← client-side auth/admin guard
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── ManagePayments.jsx    ← placeholder
│   └── AdminPanel.jsx        ← placeholder
├── styles/
│   ├── global.css            ← tokens, reset, forms, buttons
│   └── auth.css              ← login/register card styles
├── App.jsx                   ← React Router setup
└── main.jsx                  ← entry point
```

---

## Step 8: Login & Register Pages (validation + premium CSS) — 2026-07-07

**What I built:**
- **`pages/Register.jsx`** — added a **Confirm Password** field and full client-side validation:
  - Username required, email format regex, password ≥ 6 chars, passwords must match.
  - Uses `noValidate` on the form to suppress browser defaults and show our own styled error banner.
  - On success: stores token + user via `AuthContext.login()`, redirects to `/payments`.
- **`pages/Login.jsx`** — added client-side validation (email format, required fields) before calling the API.
- **`styles/auth.css`** — premium mobile-first overhaul:
  - Subtle gradient background (`linear-gradient` on the page).
  - Card slide-in animation (`@keyframes auth-card-in`).
  - Shake animation on error (`@keyframes auth-shake`).
  - Gradient primary button with hover lift + shadow.
  - Uppercase labels, rounded inputs with focus glow.
  - `100dvh` for proper mobile viewport handling.
  - Responsive `@media` breakpoint at 440px.

**Why — client-side validation vs. server-side validation:**

| Aspect | Client-side (JS in the browser) | Server-side (Express controller) |
|--------|---------------------------------|----------------------------------|
| **Speed** | Instant — no network round-trip. The user sees "Passwords do not match" before any request is sent. | Requires a request → server processing → response. Even on fast connections, that's 50–200ms. |
| **UX** | Better — errors appear immediately, the submit button isn't even clicked wastefully. | Acceptable, but slower feedback loop. |
| **Security** | **None** — anyone can open DevTools, disable JS, or call the API directly with curl. Client-side validation is trivially bypassable. | **The real gatekeeper.** The server rejects bad input regardless of what the client does. |
| **Bypassability** | Completely bypassable | Cannot be bypassed without access to the server itself |

**Why both are implemented:**
1. **Client-side** catches obvious mistakes instantly (empty fields, mismatched passwords, bad email format) and prevents unnecessary API calls — this is a **UX optimisation**.
2. **Server-side** (in `authController.js`) re-validates everything and is the **security boundary**. Even if a malicious actor bypasses the React form entirely, the server will reject invalid input with proper 400/401 errors.
3. The two layers are **complementary, not redundant**: client = fast feedback, server = enforced rules.

**Key files:**
```
frontend/src/
├── pages/Login.jsx       ← client-side validation + API call + AuthContext
├── pages/Register.jsx    ← confirm password + client-side validation + API call
└── styles/auth.css       ← premium card layout, animations, gradient button
```

---

## Step 9: ManagePayments Page (full CRUD UI + PaymentModal) — 2026-07-07

**What I built:**
- **`pages/ManagePayments.jsx`** — the core screen:
  - Fetches user's payment methods on mount via `GET /api/payments`.
  - Renders a scrollable card list with type icon/badge, masked/truncated headline, edit ✏️ and delete 🗑️ action buttons.
  - "＋ Add Payment Method" dashed button opens the modal in add mode.
  - Edit button opens the modal pre-filled. Delete button shows a confirmation overlay.
  - Loading spinner, error banner, and friendly empty state with emoji.
- **`components/PaymentModal.jsx`** — bottom-sheet-style modal:
  - Payment type chip selector (Bank/Paytm/UPI/PayPal/USDT).
  - Conditional form fields rendered based on selected type.
  - Client-side validation before save. Type is locked in edit mode.
  - Save calls the parent's `onSave()` which hits POST (add) or PUT (edit).
- **`components/Navbar.jsx`** — sticky top nav with brand, active link highlighting, admin link for admin users, logout.
- **`styles/payments.css`** — mobile-first cards, bottom-sheet with slide-up animation, chip selector, conditional fields fade-in, delete confirmation overlay, spinner.
- **`styles/navbar.css`** — top navigation bar styles.
- Updated `Dashboard.jsx` and `AdminPanel.jsx` to include the Navbar.

**How conditional form fields work in the modal:**

The modal uses a `FIELD_DEFS` map — the same pattern as the backend's `FIELDS_BY_TYPE`:

```js
const FIELD_DEFS = {
  Bank:   [{ key: 'ifscCode', label: 'IFSC Code', placeholder: '...' }, ...],
  Paytm:  [{ key: 'paytmNumber', ... }],
  UPI:    [{ key: 'upiId', ... }],
  ...
};
```

When the user selects a `paymentType`, the component reads `FIELD_DEFS[paymentType]` and renders only those inputs:

```jsx
{currentDefs.map((f) => (
  <div className="form-group" key={f.key}>
    <label>{f.label}</label>
    <input value={fields[f.key]} onChange={...} />
  </div>
))}
```

This means:
- **Adding a new payment type** = one new entry in `FIELD_DEFS` + a chip label. No if/else chains.
- **Validation** iterates the same array: if any field in `FIELD_DEFS[paymentType]` is empty, the save is blocked.
- **Edit mode** pre-fills `fields` from `initialData` using the same `FIELD_DEFS` keys.

**Why the backend ownership check (Step 5) means this page is inherently safe:**

The backend's `GET /api/payments` handler filters by `{ user: req.user._id }` — it physically cannot return another user's documents. Even if someone modified the frontend code to try requesting someone else's data, the server would only ever return documents belonging to the JWT holder. Similarly, PUT and DELETE verify `method.user === req.user._id` before acting. This page doesn't implement any ownership logic because **the API layer already guarantees it**.

**Key files:**
```
frontend/src/
├── components/
│   ├── PaymentModal.jsx    ← add/edit bottom-sheet, conditional fields, type chips
│   └── Navbar.jsx          ← top navigation bar
├── pages/
│   ├── ManagePayments.jsx  ← card list + CRUD + empty/loading/error states
│   ├── Dashboard.jsx       ← updated with Navbar
│   └── AdminPanel.jsx      ← updated with Navbar
└── styles/
    ├── payments.css        ← cards, modal, chips, animations, empty state
    └── navbar.css          ← top nav styles
```
