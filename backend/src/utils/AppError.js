class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    if (options.details && typeof options.details === 'object') {
      this.details = options.details;
    }

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
