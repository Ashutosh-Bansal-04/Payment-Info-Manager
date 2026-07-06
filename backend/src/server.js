require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Future route mounts will go here:
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/payments', require('./routes/payment.routes'));

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
