const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect – verifies the JWT from the Authorization header (Bearer <token>),
 * attaches the full user document (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // ---- Extract token ----
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised — no token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // ---- Verify ----
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ---- Attach user (without password) ----
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorised — user no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorised — token has expired.' });
    }
    return res.status(401).json({ message: 'Not authorised — invalid token.' });
  }
};

/**
 * adminOnly – must be used AFTER protect.
 * Rejects with 403 if the authenticated user is not an admin.
 */
const adminOnly = (_req, res, next) => {
  if (_req.user && _req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden — admin access required.' });
};

module.exports = { protect, adminOnly };
