const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// ---------------------------------------------------------------------------
// Rate limiting on auth routes — reduces brute-force / credential-stuffing risk.
//
// - Register: 10 requests per 15-min window per IP.
// - Login:    20 requests per 15-min window per IP.
//
// These are intentionally lenient for dev; tighten in production.
// ---------------------------------------------------------------------------
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again in 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// POST /api/auth/register
router.post('/register', registerLimiter, register);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

module.exports = router;
