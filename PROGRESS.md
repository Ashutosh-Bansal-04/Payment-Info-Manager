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
