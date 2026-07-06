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
