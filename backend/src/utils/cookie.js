// ---------------------------------------------------------------------------
// Cookie options for the refresh token
//
// In production the cookie must be `Secure` and `SameSite=None` so it can be
// shared across subdomains. During local development this would prevent the
// cookie from being sent over plain HTTP, causing 401 errors when attempting to
// refresh the session.  Use `NODE_ENV` to automatically disable the `Secure`
// flag and relax `SameSite` when not running in production.
// ---------------------------------------------------------------------------

const { REFRESH_TOKEN_MAX_AGE } = require("../config/tokens");

// Use the provided cookie domain or fall back to the production domain so
// browsers store the csrfToken cookie when deployed.
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".eduskillbridge.net" : undefined);

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: REFRESH_TOKEN_MAX_AGE,
};

// CSRF token needs to be readable by the client so `httpOnly` is false, but we
// still apply the same domain, `secure` and `sameSite` rules as the refresh
// token to ensure it is available across subdomains in production.
const csrfCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
};

if (COOKIE_DOMAIN) {
  refreshCookieOptions.domain = COOKIE_DOMAIN;
  csrfCookieOptions.domain = COOKIE_DOMAIN;
}

module.exports = { refreshCookieOptions, csrfCookieOptions };
