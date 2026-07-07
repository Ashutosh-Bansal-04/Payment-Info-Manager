const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// --------------- Helpers ---------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input length caps — prevents abuse / oversized payloads
const MAX_USERNAME = 50;
const MAX_EMAIL = 100;
const MAX_PASSWORD = 128;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitiseUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

// --------------- Controllers ---------------

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // ---- Input validation with length limits ----
    if (!username || !email || !password) {
      throw new AppError('Username, email, and password are required.', 400);
    }
    if (typeof username !== 'string' || username.length > MAX_USERNAME) {
      throw new AppError(`Username must be at most ${MAX_USERNAME} characters.`, 400);
    }
    if (typeof email !== 'string' || email.length > MAX_EMAIL) {
      throw new AppError(`Email must be at most ${MAX_EMAIL} characters.`, 400);
    }
    if (!EMAIL_RE.test(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('Password must be at least 6 characters.', 400);
    }
    if (password.length > MAX_PASSWORD) {
      throw new AppError(`Password must be at most ${MAX_PASSWORD} characters.`, 400);
    }

    // ---- Duplicate check ----
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // ---- Hash & create ----
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: username.trim(),
      email,
      password: hashedPassword,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitiseUser(user) });
  } catch (err) {
    next(err); // → centralized errorHandler
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ---- Input validation ----
    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }
    if (typeof email !== 'string' || email.length > MAX_EMAIL) {
      throw new AppError('Invalid email.', 400);
    }
    if (!EMAIL_RE.test(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }
    if (typeof password !== 'string' || password.length > MAX_PASSWORD) {
      throw new AppError('Invalid credentials.', 401);
    }

    // ---- Authenticate ----
    const INVALID_MSG = 'Invalid email or password.';

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError(INVALID_MSG, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError(INVALID_MSG, 401);
    }

    const token = signToken(user._id);
    res.json({ token, user: sanitiseUser(user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
