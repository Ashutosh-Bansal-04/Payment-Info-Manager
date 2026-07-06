# Payment Info Manager

A full-stack web application for managing payment information across multiple payment methods (Bank, Paytm, UPI, PayPal, USDT).

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React (Vite), plain CSS / CSS Modules |
| Backend  | Node.js, Express.js               |
| Database | MongoDB (Mongoose ODM)            |
| Auth     | JWT + bcrypt                      |

## Project Structure

```
payment-info-manager/
├── backend/               # Express API server
│   ├── src/
│   │   ├── config/        # DB connection, app config
│   │   ├── controllers/   # Route handlers / business logic
│   │   ├── middleware/     # Auth middleware, error handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express route definitions
│   │   ├── utils/         # Helpers (token generation, etc.)
│   │   └── server.js      # Entry point
│   ├── .env.example       # Env var template
│   └── package.json
├── frontend/              # React + Vite client
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── PROGRESS.md            # Running build log
└── README.md              # ← You are here
```

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (default `mongodb://localhost:27017`) or a MongoDB Atlas URI

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url> && cd payment-info-manager

# Backend
cd backend
cp .env.example .env   # edit .env with your MongoDB URI & JWT secret
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run in development

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173` by default.

## Payment Types Supported

| Type   | Key Fields                              |
|--------|-----------------------------------------|
| Bank   | Account holder, account number, IFSC, bank name |
| Paytm  | Paytm number, name                     |
| UPI    | UPI ID, name                            |
| PayPal | PayPal email, name                      |
| USDT   | Wallet address, network (TRC-20/ERC-20)|

## License

ISC
