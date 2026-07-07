require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

const errorHandler = require('./middleware/errorHandler');

// --------------- Middleware ---------------
app.use(cors());
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

module.exports = app;
