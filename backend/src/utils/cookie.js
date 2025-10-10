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

const normalizeDomain = (domain) => {
  if (!domain) return null;
  const trimmed = domain.trim();
  if (!trimmed) return null;
  const withoutScheme = trimmed.replace(/^https?:\/\//i, '');
  const clean = withoutScheme.replace(/\/.*$/, '');
  if (!clean) return null;
  return clean.startsWith('.') ? clean : `.${clean}`;
};

const cookieDomain =
  normalizeDomain(process.env.COOKIE_DOMAIN) || normalizeDomain(process.env.APP_DOMAIN);

if (cookieDomain) {
  refreshCookieOptions.domain = cookieDomain;
  csrfCookieOptions.domain = cookieDomain;
}

module.exports = { refreshCookieOptions, csrfCookieOptions };
