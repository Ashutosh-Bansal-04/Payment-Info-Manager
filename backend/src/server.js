require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// --------------- Security ---------------
// Helmet — secure HTTP headers, but allow cross-origin requests from our frontend
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

// CORS — lock to explicit allowed origins, never wildcard in production
const allowedOrigins = [
  process.env.FRONTEND_URL,       // deployed frontend (e.g. https://payment-info-manager.vercel.app)
  'http://localhost:5173',         // Vite dev server
  'http://localhost:4173',         // Vite preview
].filter(Boolean).map(u => u.replace(/\/+$/, '')); // strip trailing slashes

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// --------------- Body parsing ---------------
app.use(express.json({ limit: '10kb' })); // cap body size to prevent abuse

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Payment routes (all require auth — protect middleware applied in router)
app.use('/api/payments', require('./routes/paymentRoutes'));

// Admin routes (require auth + admin role)
app.use('/api/admin', require('./routes/adminRoutes'));

// --------------- 404 catch-all for unmatched API routes ---------------
app.all('/api/{*path}', (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// --------------- Centralized Error Handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start ---------------
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });

// --------------- Global safety nets ---------------
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  // In production you'd gracefully shut down; in dev just log it
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

module.exports = app;
