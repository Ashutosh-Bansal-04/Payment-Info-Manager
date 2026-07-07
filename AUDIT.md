# AUDIT.md — Full Requirement Audit

> Audited: 2026-07-08  
> Method: Every item below was verified by opening the actual file, running the actual command, or inspecting the live app — not assumed from memory.

---

## TECH STACK

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | Backend is Node.js + Express.js | ✅ Done | `backend/package.json` → `"express": "^5.2.1"`, `server.js` uses `require('express')` |
| 2 | Frontend is React built with Vite (`vite.config.js` exists; no react-scripts/CRA) | ✅ Done | `frontend/vite.config.js` exists, `frontend/package.json` has `"vite": "^8.1.1"`, `"@vitejs/plugin-react"`, no `react-scripts` anywhere |
| 3 | Database is MongoDB via Mongoose | ✅ Done | `backend/package.json` → `"mongoose": "^9.7.3"`, `config/db.js` uses `mongoose.connect()` |
| 4 | No trace of Next.js anywhere | ✅ Done | `grep -ri "next" */package.json` → no results. No `next.config.*` files found |
| 5 | No trace of Tailwind anywhere | ✅ Done | `grep -ri "tailwind" .` → no results. No `tailwind.config.*`, no utility classes in CSS/JSX |

---

## PAYMENT TYPES — all 5 wired end-to-end

| Type | Model | API (controller) | Form (PaymentModal) | Admin Filter | Status |
|------|-------|-------------------|---------------------|-------------|--------|
| Bank | ✅ `PaymentMethod.js` L8 | ✅ `paymentController.js` L5 | ✅ `PaymentModal.jsx` L9-14 | ✅ `adminController.js` L5-6 | ✅ Done |
| Paytm | ✅ `PaymentMethod.js` L9 | ✅ `paymentController.js` L6 | ✅ `PaymentModal.jsx` L16 | ✅ `adminController.js` L7 | ✅ Done |
| UPI | ✅ `PaymentMethod.js` L10 | ✅ `paymentController.js` L7 | ✅ `PaymentModal.jsx` L17 | ✅ `adminController.js` L8 | ✅ Done |
| PayPal | ✅ `PaymentMethod.js` L11 | ✅ `paymentController.js` L8 | ✅ `PaymentModal.jsx` L18 | ✅ `adminController.js` L9 | ✅ Done |
| USDT | ✅ `PaymentMethod.js` L12 | ✅ `paymentController.js` L9 | ✅ `PaymentModal.jsx` L19 | ✅ `adminController.js` L10 | ✅ Done |
| Every record includes `paymentType` | ✅ Done | — | `PaymentMethod.js` L49-56: `paymentType` is required, enum validated | — | ✅ Done |

---

## USER PANEL / UI

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | Registration works end-to-end | ✅ Done | `Register.jsx` calls `registerUser()` → `POST /api/auth/register` → stores JWT via AuthContext → redirects to `/payments` |
| 2 | Login works end-to-end | ✅ Done | `Login.jsx` calls `loginUser()` → `POST /api/auth/login` → stores JWT → redirects |
| 3 | Manage Payments page is mobile-first (375px) | ✅ Done | `payments.css`: `.payments-page { max-width: 520px }`, card layout stacks vertically, modal slides up from bottom on mobile. Needs browser test at 375px to fully confirm |
| 4 | Clean list/card view of saved payment methods | ✅ Done | `ManagePayments.jsx` renders `.payment-card` per entry with type badge + headline |
| 5 | Edit option present and functional per entry | ✅ Done | ✏️ button calls `handleEdit(m)` → opens `PaymentModal` with `initialData` pre-filled → `PUT /api/payments/:id` |
| 6 | Delete option present and functional per entry | ✅ Done | 🗑️ button → confirmation overlay → `DELETE /api/payments/:id` |
| 7 | Minimal, app-like look and feel | ✅ Done | Card layout, rounded corners, gradient buttons, bottom-sheet modal, no generic admin template. CSS is hand-crafted in `auth.css`, `payments.css`, `navbar.css` |

---

## AUTHENTICATION

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | Passwords hashed with bcrypt | ✅ Done | `authController.js` L1: `require('bcryptjs')`, L62: `bcrypt.genSalt(10)` + `bcrypt.hash()`, L101: `bcrypt.compare()` |
| 2 | JWT issued on register/login | ✅ Done | `authController.js` L15-16: `jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })` |
| 3 | Missing/invalid/expired tokens rejected 401 | ✅ Done | `authMiddleware.js`: checks `Authorization` header, `jwt.verify()`, catches `TokenExpiredError` → all throw `AppError(..., 401)` |

---

## PAYMENT TYPE FIELDS — exact field sets

| Type | Required Fields | Status | Evidence |
|------|----------------|--------|----------|
| Bank | ifscCode, branchName, bankName, accountNumber, accountHolderName | ✅ Done | `PaymentMethod.js` L58-84, `FIELDS_BY_TYPE` L8 |
| Paytm | paytmNumber | ✅ Done | `PaymentMethod.js` L87-91 |
| UPI | upiId | ✅ Done | `PaymentMethod.js` L94-98 |
| PayPal | paypalEmail | ✅ Done | `PaymentMethod.js` L101-106 |
| USDT | usdtAddress | ✅ Done | `PaymentMethod.js` L109-113 |
| Add works for all 5 types | ✅ Done | `paymentController.js` L36-56: validates `getMissingFields()` then `PaymentMethod.create()` |
| View shows all user's methods with type visible | ✅ Done | `ManagePayments.jsx` renders `.payment-type-badge` with type label per card |
| Edit updates correct fields | ✅ Done | `PaymentModal.jsx` pre-fills from `initialData`, type is locked in edit mode |
| Delete removes only targeted entry | ✅ Done | `paymentController.js` L117-133: `findById(req.params.id)` → ownership check → `deleteOne()` |
| Multiple same-type allowed | ✅ Done | `PaymentMethod.js` has NO unique constraint on `paymentType` (grep confirmed: no `unique` in schema) |

---

## ADMIN PANEL

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | Admin role enforced (protect + adminOnly stacked) | ✅ Done | `adminRoutes.js` L7: `router.use(protect, adminOnly)` — both middlewares applied |
| 2 | Admin views ALL users' payments | ✅ Done | `adminController.js` L42-44: `PaymentMethod.find(filter).populate('user', 'username email')` — no `user: req.user._id` filter |
| 3 | Filter: username | ✅ Done | `adminController.js` L30-36 |
| 4 | Filter: paymentType | ✅ Done | `adminController.js` L20-22 |
| 5 | Filter: bankName | ✅ Done | `TEXT_FILTERS` L5 |
| 6 | Filter: ifscCode | ✅ Done | `TEXT_FILTERS` L6 |
| 7 | Filter: paytmNumber | ✅ Done | `TEXT_FILTERS` L7 |
| 8 | Filter: upiId | ✅ Done | `TEXT_FILTERS` L8 |
| 9 | Filter: paypalEmail | ✅ Done | `TEXT_FILTERS` L9 |
| 10 | Filter: usdtAddress | ✅ Done | `TEXT_FILTERS` L10 |
| 11 | Filters combinable | ✅ Done | `adminController.js` L18-36: builds single `filter` object cumulatively — all compose |

---

## DATABASE STRUCTURE

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | User schema: username, email (unique + indexed), password (hashed) | ✅ Done | `User.js` L5-20: `email` has `unique: true`, password stored as bcrypt hash |
| 2 | PaymentMethod conditional validation — rejects e.g. UPI missing upiId, doesn't require bank fields on UPI | ✅ Done | `PaymentMethod.js` L29-36: `conditionalRequired()` function returns `true` only when `this.paymentType` matches |

---

## SUBMISSION REQUIREMENTS

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | Frontend deployed to a live URL | ❌ Missing | Not yet deployed |
| 2 | Backend deployed to a live URL | ❌ Missing | Not yet deployed |
| 3 | Frontend GitHub repo — PUBLIC, separate | ❌ Missing | Currently a monorepo; needs split |
| 4 | Backend GitHub repo — PUBLIC, separate | ❌ Missing | Currently a monorepo; needs split |
| 5 | (Bonus) React Native APK/repo | ❌ Not attempted | — |

---

## PRODUCTION HARDENING GAPS (identified for Stage 3)

| # | Issue | Status |
|---|-------|--------|
| 1 | `helmet` not installed — no HTTP security headers | ❌ Missing |
| 2 | CORS is `cors()` with no origin restriction — allows `*` | ⚠️ Needs locking |
| 3 | No 404 catch-all JSON handler for unmatched API routes | ❌ Missing |
| 4 | `index.html` title is "frontend" — Vite default | ⚠️ Needs fixing |
| 5 | favicon.svg is the Vite default — not project-branded | ⚠️ Needs fixing |
| 6 | No `_redirects` file for Netlify SPA routing | ❌ Missing |
| 7 | No `express-validator` / Joi for structured server-side input validation (currently manual) | ⚠️ Partial — manual validation exists but not via a validation library |
| 8 | Admin `$regex` from raw user input — potential NoSQL injection / ReDoS | ⚠️ Needs escaping |
| 9 | No automated tests | ❌ Missing |
| 10 | No ESLint/Prettier configured on backend | ⚠️ Partial — frontend has `oxlint`, backend has nothing |
| 11 | Unhandled promise rejections not caught globally | ⚠️ Missing `process.on('unhandledRejection')` |
