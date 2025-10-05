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
const {
  COOKIE_DOMAIN,
  COOKIE_SECURE,
  COOKIE_SAMESITE,
  NODE_ENV,
} = require("../config/env");

// Use the provided cookie domain when available. Leaving it undefined allows
// browsers to scope the cookie to the current host which works for local
// development and custom deployments without additional configuration.
const domain = COOKIE_DOMAIN ? COOKIE_DOMAIN.trim() || undefined : undefined;

const secure =
  COOKIE_SECURE !== undefined ? COOKIE_SECURE : NODE_ENV === "production";

const resolveSameSite = () => {
  if (COOKIE_SAMESITE) {
    if (COOKIE_SAMESITE === "none") {
      return "None";
    }
    if (COOKIE_SAMESITE === "lax") {
      return "Lax";
    }
    if (COOKIE_SAMESITE === "strict") {
      return "Strict";
    }
  }

  return NODE_ENV === "production" ? "None" : "Lax";
};

const sameSite = resolveSameSite();

const refreshCookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  maxAge: REFRESH_TOKEN_MAX_AGE,
};

// CSRF token needs to be readable by the client so `httpOnly` is false, but we
// still apply the same domain, `secure` and `sameSite` rules as the refresh
// token to ensure it is available across subdomains in production.
const csrfCookieOptions = {
  httpOnly: false,
  secure,
  sameSite,
};

if (domain) {
  refreshCookieOptions.domain = domain;
  csrfCookieOptions.domain = domain;
}

module.exports = { refreshCookieOptions, csrfCookieOptions };
