const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --------------- Helpers ---------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Build a signed JWT for the given user id.
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * Strip the password field and return a plain user object safe for the client.
 */
const sanitiseUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

// --------------- Controllers ---------------

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ---- Input validation ----
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // ---- Duplicate check ----
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // ---- Hash & create ----
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // ---- Respond ----
    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitiseUser(user) });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---- Input validation ----
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // ---- Authenticate ----
    // Generic message prevents leaking whether email or password was wrong.
    const INVALID_MSG = 'Invalid email or password.';

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: INVALID_MSG });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: INVALID_MSG });
    }

    // ---- Respond ----
    const token = signToken(user._id);
    res.json({ token, user: sanitiseUser(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { register, login };
