/**
 * AppError — custom error class with an HTTP status code.
 *
 * Controllers throw `new AppError(message, statusCode)` instead of calling
 * res.status().json() directly. The centralized errorHandler middleware
 * catches it and sends a uniform JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
