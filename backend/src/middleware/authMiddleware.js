const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * protect – verifies the JWT from the Authorization header (Bearer <token>),
 * attaches the full user document (minus password) to req.user.
 */
const protect = async (req, _res, next) => {
  try {
    // ---- Extract token ----
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorised — no token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    // ---- Verify ----
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ---- Attach user (without password) ----
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('Not authorised — user no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.isOperational) {
      return next(err); // our AppError
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Not authorised — token has expired.', 401));
    }
    return next(new AppError('Not authorised — invalid token.', 401));
  }
};

/**
 * adminOnly – must be used AFTER protect.
 * Rejects with 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, _res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(new AppError('Forbidden — admin access required.', 403));
};

module.exports = { protect, adminOnly };
