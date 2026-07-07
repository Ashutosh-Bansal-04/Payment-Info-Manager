/**
 * Centralized error-handling middleware for Express.
 *
 * This is mounted LAST in server.js via app.use(errorHandler).
 * Any error thrown or passed to next(err) from routes/controllers
 * ends up here and gets a consistent JSON shape:
 *
 *   { message: "...", details?: ... }
 *
 * It handles:
 *   - AppError (our custom class) → uses its statusCode + message.
 *   - Mongoose ValidationError → 400 with field-level messages.
 *   - Mongoose CastError (bad ObjectId) → 404.
 *   - Duplicate key (code 11000) → 409 conflict.
 *   - Everything else → generic 500.
 */

const errorHandler = (err, _req, res, _next) => {
  // ---- Default values ----
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = undefined;

  // ---- Mongoose ValidationError ----
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const fieldErrors = Object.values(err.errors).map((e) => e.message);
    message = fieldErrors.join('. ');
    details = fieldErrors;
  }

  // ---- Mongoose CastError (invalid ObjectId) ----
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found.';
  }

  // ---- MongoDB duplicate key (unique constraint) ----
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}. This ${field} is already in use.`;
  }

  // ---- Log unexpected (non-operational) errors ----
  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({ message, ...(details && { details }) });
};

module.exports = errorHandler;
