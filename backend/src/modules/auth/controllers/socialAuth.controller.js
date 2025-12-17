const { URL, URLSearchParams } = require('url');
// Import the configured passport instance
const { passport } = require('../../../config/passport');
const { refreshCookieOptions, accessCookieOptions } = require('../../../utils/cookie');
const { frontendBase, allowedOrigins } = require('../../../utils/frontend');

const allowedOriginMap = allowedOrigins.reduce((acc, origin) => {
  acc[origin.toLowerCase()] = origin;
  return acc;
}, {});

const matchAllowedOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  return allowedOriginMap[lower] || null;
};

const extractOriginFromReferer = (referer) => {
  if (!referer || typeof referer !== 'string') return null;
  try {
    const url = new URL(referer);
    return url.origin;
  } catch (_) {
    return null;
  }
};

const resolveRequestedOrigin = (req) => {
  return (
    matchAllowedOrigin(req.query?.origin) ||
    matchAllowedOrigin(req.get?.('origin')) ||
    matchAllowedOrigin(extractOriginFromReferer(req.get?.('referer')))
  );
};

const sanitizeRedirectPath = (value) => {
  const raw = typeof value === 'string' ? value : null;
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch (_) {
    decoded = raw;
  }
  const trimmed = decoded.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (/^[a-z]+:\/\//i.test(trimmed)) return null;
  if (/[\r\n]/.test(trimmed)) return null;
  if (trimmed.length > 1024) return null;
  return trimmed;
};

const rememberSocialIntent = (req, provider) => {
  if (!req?.session) return;
  const redirectParam = req.query?.redirect || req.query?.next;
  req.session.socialAuthIntent = {
    provider,
    origin: resolveRequestedOrigin(req),
    redirect: sanitizeRedirectPath(redirectParam),
    createdAt: Date.now(),
  };
};

const consumeSocialIntent = (req, provider) => {
  if (!req?.session?.socialAuthIntent) return {};
  const intent = req.session.socialAuthIntent;
  delete req.session.socialAuthIntent;
  if (intent.provider && intent.provider !== provider) {
    return {};
  }
  return {
    origin: matchAllowedOrigin(intent.origin),
    redirect: sanitizeRedirectPath(intent.redirect),
  };
};

const buildRedirectUrl = (origin, redirect) => {
  const base = origin || frontendBase;
  if (!redirect) {
    return `${base}/auth/social-success`;
  }
  const params = new URLSearchParams({ redirect });
  return `${base}/auth/social-success?${params.toString()}`;
};

// Shared callback handler for social auth providers
const handleCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, (err, result) => {
    const intent = consumeSocialIntent(req, provider);
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken, accessToken } = result;
    res
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .cookie('token', accessToken, accessCookieOptions);

    const origin =
      intent.origin || resolveRequestedOrigin(req) || frontendBase;
    const redirectParam = intent.redirect;
    const redirectUrl = buildRedirectUrl(origin, redirectParam);
    res.redirect(redirectUrl);
  })(req, res, next);
};

const createAuthStarter = (provider, options) => (req, res, next) => {
  rememberSocialIntent(req, provider);
  passport.authenticate(provider, options)(req, res, next);
};

// Google OAuth
exports.googleAuth = createAuthStarter('google', {
  scope: ['profile', 'email'],
});

exports.googleCallback = handleCallback('google');

// Facebook OAuth
exports.facebookAuth = createAuthStarter('facebook', { scope: ['email'] });

exports.facebookCallback = handleCallback('facebook');

// Apple OAuth
exports.appleAuth = createAuthStarter('apple', { scope: ['name', 'email'] });

exports.appleCallback = handleCallback('apple');

// GitHub OAuth
exports.githubAuth = createAuthStarter('github', { scope: ['user:email'] });

exports.githubCallback = handleCallback('github');
