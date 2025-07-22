// ---------------------------------------------------------------------------
// Cookie options for the refresh token
//
// In production the cookie must be `Secure` and `SameSite=None` so it can be
// shared across subdomains. During local development this would prevent the
// cookie from being sent over plain HTTP, causing 401 errors when attempting to
// refresh the session.  Use `NODE_ENV` to automatically disable the `Secure`
// flag and relax `SameSite` when not running in production.
// ---------------------------------------------------------------------------

const refreshCookieOptions = {
  httpOnly: true,
  // Allow overriding cookie security via environment variables. This makes
  // local HTTPS-less development possible even when NODE_ENV is "production".
  secure:
    typeof process.env.COOKIE_SECURE !== 'undefined'
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  sameSite:
    process.env.COOKIE_SAMESITE ||
    (process.env.NODE_ENV === 'production' ? 'None' : 'Lax'),
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

if (process.env.COOKIE_DOMAIN) {
  refreshCookieOptions.domain = process.env.COOKIE_DOMAIN;
}

module.exports = { refreshCookieOptions };
