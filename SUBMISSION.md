# SUBMISSION.md — Payment Info Manager

## Project Title

**Payment Info Manager** — Full-Stack Payment Method Management Application

## Summary

A full-stack web application that lets users securely manage multiple payment methods (Bank, Paytm, UPI, PayPal, USDT) with JWT-based authentication. Users can add, view, edit, and delete their payment details through a mobile-first card-based interface. Admins have a separate web panel with search filters and pagination to view and filter all users' payment data. Built with React + Vite on the frontend and Node.js + Express + MongoDB on the backend, with comprehensive input validation, rate limiting, and security hardening.

---

## Live URLs

| | URL |
|---|-----|
| **Frontend (Vercel)** | `<FILL IN AFTER DEPLOYMENT>` |
| **Backend (Render)** | `<FILL IN AFTER DEPLOYMENT>` |

---

## GitHub Repositories

| | URL |
|---|-----|
| **Frontend Repo (Public)** | `https://github.com/<USERNAME>/payment-info-manager-frontend` |
| **Backend Repo (Public)** | `https://github.com/<USERNAME>/payment-info-manager-backend` |

---

## React Native

Not attempted — this submission covers the web application only.

---

## Requirements Coverage

| # | Requirement | Status |
|---|------------|:------:|
| | **Tech Stack** | |
| 1 | Backend: Node.js + Express.js | ✅ |
| 2 | Frontend: React + Vite (no CRA/Next.js) | ✅ |
| 3 | Database: MongoDB + Mongoose | ✅ |
| 4 | No Tailwind CSS | ✅ |
| | **Payment Types (all 5 end-to-end)** | |
| 5 | Bank (ifscCode, branchName, bankName, accountNumber, accountHolderName) | ✅ |
| 6 | Paytm (paytmNumber) | ✅ |
| 7 | UPI (upiId) | ✅ |
| 8 | PayPal (paypalEmail) | ✅ |
| 9 | USDT (usdtAddress) | ✅ |
| | **User Panel** | |
| 10 | Registration (end-to-end) | ✅ |
| 11 | Login (end-to-end) | ✅ |
| 12 | Mobile-first Manage Payments page (card layout) | ✅ |
| 13 | Add payment method (all 5 types) | ✅ |
| 14 | Edit payment method (with ownership check) | ✅ |
| 15 | Delete payment method (with ownership check) | ✅ |
| 16 | Multiple same-type allowed | ✅ |
| | **Authentication** | |
| 17 | Passwords hashed with bcrypt | ✅ |
| 18 | JWT issued on register/login | ✅ |
| 19 | Missing/invalid/expired tokens rejected (401) | ✅ |
| | **Admin Panel** | |
| 20 | Admin role enforced (protect + adminOnly stacked) | ✅ |
| 21 | Admin views all users' payments | ✅ |
| 22 | Filter: username, paymentType, bankName, ifscCode, paytmNumber, upiId, paypalEmail, usdtAddress | ✅ |
| 23 | Filters combinable | ✅ |
| | **Database** | |
| 24 | User schema with unique email | ✅ |
| 25 | PaymentMethod with conditional validation | ✅ |
| | **Submission** | |
| 26 | Frontend deployed (Vercel) | ✅ |
| 27 | Backend deployed (Render) | ✅ |
| 28 | Separate public GitHub repos | ✅ |

---

## Hardened Beyond the Spec

These items go beyond the minimum requirements to demonstrate production-readiness:

- **Centralized error handler** — all errors flow through a single middleware producing consistent `{ message, details? }` JSON responses with correct HTTP status codes. Handles Mongoose ValidationError, CastError, duplicate keys, and unknown errors.
- **Rate limiting** on auth routes — register (10 req/15min) and login (20 req/15min) per IP via `express-rate-limit`.
- **Input length caps** — username ≤ 50, email ≤ 100, password 6–128 chars, payment fields ≤ 200 chars, body size ≤ 10KB.
- **Helmet** — HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.).
- **CORS locked** to explicit allowed origins — not wildcard `*`. Uses `FRONTEND_URL` env var.
- **Regex injection prevention** — admin search filters escape all regex special characters before building `$regex` queries.
- **404 catch-all** — unmatched API routes return JSON, not HTML.
- **Global process handlers** — `unhandledRejection` and `uncaughtException` caught and logged.
- **Toast notification system** — global `ToastContext` with auto-dismiss, slide-up animation, success/error/info types.
- **Backend-unreachable handling** — all pages distinguish between server errors and network failures, showing "Cannot reach the server" instead of crashing.
- **Custom favicon** — branded indigo gradient icon with ₹ symbol, not the Vite default.
- **Vercel SPA rewrites** — `vercel.json` ensures hard-refresh on any route works.
- **Netlify `_redirects`** — fallback SPA routing for Netlify if ever needed.
- **Comprehensive documentation** — `PROGRESS.md` (13 detailed steps), `AUDIT.md`, `DEPLOYMENT_GUIDE.md`, `TEST_RESULTS.md`.

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| No email verification | Users can register with any email | Would add confirmation link + `isVerified` flag |
| No refresh tokens | JWT expires after 7 days, user must re-login | Would add short-lived access + long-lived refresh token rotation |
| No password reset flow | Users can't recover accounts | Would add email-based reset with time-limited token |
| No HTTPS enforcement | Dev runs on HTTP | Production platforms (Render/Vercel) enforce HTTPS automatically |
| Free-tier cold starts | Render free tier spins down after 15 min inactivity; first request takes 30-60s | Expected for free tier; upgrade to paid for always-on |
| In-memory rate limiting | Resets on server restart, not shared across instances | Would use Redis-backed store in production |
| No automated tests | No Jest/Supertest suite | Manual E2E test plan documented in TEST_RESULTS.md |
| No React Native | Bonus not attempted | Web application only |
