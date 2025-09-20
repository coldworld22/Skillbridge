const logger = require('../../utils/logger.js');
const socialLoginConfigService = require('../socialLoginConfig/socialLoginConfig.service');

// Allow this service to run on Node versions prior to 18 where `fetch` is not
// available globally. Node-fetch v3 is ESM only, so use a dynamic import when
// required. This keeps the implementation compatible with both CommonJS and
// newer Node runtimes.
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const FAILS_OPEN = process.env.RECAPTCHA_FAILS_OPEN !== 'false';

exports.shouldBypass = (cfg, body = {}) => {
  if (!cfg?.recaptcha?.active) return false;
  if (!FAILS_OPEN) return false;
  if (!body?.recaptchaBypass) return false;
  if (body?.recaptchaToken) return false;
  return true;
};

exports.verify = async (token, remoteIp) => {
  const cfg = await socialLoginConfigService.getSettings();
  const recaptcha = cfg?.recaptcha || {};
  if (!recaptcha.active) {
    return true; // disabled -> skip verification
  }
  if (!recaptcha.secretKey) {
    logger.warn('reCAPTCHA is active but missing a secret key – skipping verification');
    return true;
  }
  if (!recaptcha.siteKey) {
    logger.warn('reCAPTCHA is active but missing a site key – skipping verification');
    return true; // disabled -> skip verification
  }
  if (!token) {
    return false;
  }
  const params = new URLSearchParams({
    secret: recaptcha.secretKey || '',
    response: token,
  });
  if (remoteIp) params.append('remoteip', remoteIp);
  try {
    const res = await fetchFn('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params,
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    logger.error('reCAPTCHA verify failed:', err.message);
    if (FAILS_OPEN) {
      logger.warn('reCAPTCHA verification failed but fails-open mode is enabled – skipping verification');
      return true;
    }
    return false;
  }
};
