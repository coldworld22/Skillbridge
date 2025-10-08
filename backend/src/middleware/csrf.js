const csurf = require('csurf');
const { csrfCookieOptions } = require('../utils/cookie');

// Generate a CSRF token for every request but do not enforce validation yet.
// This ensures req.csrfToken() is always available so we can expose the token
// to clients via a cookie.
const generateToken = csurf({
  cookie: false,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

// Middleware that verifies the CSRF token for unsafe requests.
const verifyToken = csurf({ cookie: false });

const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
const exemptPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-reset',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/reset-password',
];

module.exports = [
  generateToken,
  (req, res, next) => {
    if (
      process.env.NODE_ENV === 'test' ||
      !unsafeMethods.includes(req.method) ||
      exemptPaths.includes(req.path) ||
      /^\/api\/ads\/[^/]+\/(view|click)$/.test(req.path)
    ) {
      return next();
    }
    return verifyToken(req, res, next);
  },
  (req, res, next) => {
    try {
      const token = req.csrfToken();
      res.cookie('csrfToken', token, csrfCookieOptions);
    } catch (e) {
      // ignore if token generation failed
    }
    next();
  },
];
