const logger = require('../utils/logger');
const config = require('./env');

let cachedUrl;
let cachedError;
let resolved = false;

const hasScheme = (value) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);

const normalizeBaseUrl = (value) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    const sanitizedPath = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    return `${url.origin}${sanitizedPath}`;
  } catch {
    return null;
  }
};

const shouldIncludePort = (port, protocol) => {
  const numeric = Number(port);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return false;
  }
  const defaultPort = protocol === 'https' ? 443 : 80;
  return numeric !== defaultPort;
};

const buildFromAppDomain = () => {
  const domain = (config.APP_DOMAIN || '').trim();
  if (!domain) {
    return null;
  }

  if (hasScheme(domain)) {
    return domain;
  }

  const protocol = config.NODE_ENV === 'production' ? 'https' : 'http';
  const portSegment = shouldIncludePort(config.BACKEND_PORT, protocol)
    ? `:${config.BACKEND_PORT}`
    : '';

  return `${protocol}://${domain}${portSegment}`;
};

const buildLocalFallback = () => {
  const port = Number(config.BACKEND_PORT);
  const portSegment = Number.isFinite(port) && port > 0 ? `:${port}` : '';
  return `http://localhost${portSegment}`;
};

const resolve = () => {
  if (resolved) {
    return { url: cachedUrl, error: cachedError };
  }

  resolved = true;
  const candidates = [];
  const explicit = (process.env.BACKEND_URL || '').trim();
  if (explicit) {
    candidates.push(explicit);
  }

  const domainCandidate = buildFromAppDomain();
  if (domainCandidate) {
    candidates.push(domainCandidate);
  }

  if (config.NODE_ENV !== 'production') {
    candidates.push(buildLocalFallback());
  }

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) {
      cachedUrl = normalized;
      cachedError = undefined;
      return { url: cachedUrl, error: cachedError };
    }
  }

  cachedUrl = undefined;
  cachedError =
    'Unable to determine backend base URL. Set BACKEND_URL or provide APP_DOMAIN and BACKEND_PORT.';
  logger.error('[config] %s', cachedError);
  return { url: cachedUrl, error: cachedError };
};

const getBackendBaseUrl = () => resolve().url;

const requireBackendBaseUrl = () => {
  const { url, error } = resolve();
  if (!url) {
    throw new Error(error);
  }
  return url;
};

const getBackendBaseUrlError = () => resolve().error;

const resetBackendBaseUrlCache = () => {
  cachedUrl = undefined;
  cachedError = undefined;
  resolved = false;
};

module.exports = {
  getBackendBaseUrl,
  requireBackendBaseUrl,
  getBackendBaseUrlError,
  resetBackendBaseUrlCache,
};
