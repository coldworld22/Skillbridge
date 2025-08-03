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
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// CSRF token needs to be readable by the client so `httpOnly` is false, but we
// still apply the same domain, `secure` and `sameSite` rules as the refresh
// token to ensure it is available across subdomains in production.
const csrfCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
};

if (process.env.COOKIE_DOMAIN) {
  refreshCookieOptions.domain = process.env.COOKIE_DOMAIN;
  csrfCookieOptions.domain = process.env.COOKIE_DOMAIN;
}

module.exports = { refreshCookieOptions, csrfCookieOptions };
