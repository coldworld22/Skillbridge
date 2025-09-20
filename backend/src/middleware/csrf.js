const csurf = require('csurf');
const Tokens = require('csrf');
const { csrfCookieOptions } = require('../utils/cookie');

// Instantiate the same token generator used by csurf so we can manually create
// a secret + helper when the library refuses to because a token is missing on
// unsafe methods (e.g. the initial login request).
const tokens = new Tokens();

// Generate a CSRF token for every request but do not enforce validation yet.
// This ensures req.csrfToken() is always available so we can expose the token
// to clients via a cookie.
const baseGenerateToken = csurf({ cookie: false });

const ensureCsrfTokenHelper = (req) => {
  if (typeof req.csrfToken === 'function') {
    return;
  }

  if (!req.session) {
    return;
  }

  const secret = req.session.csrfSecret || tokens.secretSync();
  req.session.csrfSecret = secret;
  req.csrfToken = () => tokens.create(secret);
};

const generateToken = (req, res, next) => {
  baseGenerateToken(req, res, (err) => {
    if (err) {
      if (err.code === 'EBADCSRFTOKEN') {
        ensureCsrfTokenHelper(req);
        return next();
      }
      return next(err);
    }

    ensureCsrfTokenHelper(req);
    return next();
  });
};

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
