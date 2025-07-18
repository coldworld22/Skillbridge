const socialLoginConfigService = require('../socialLoginConfig/socialLoginConfig.service');

// Allow this service to run on Node versions prior to 18 where `fetch` is not
// available globally. Node-fetch v3 is ESM only, so use a dynamic import when
// required. This keeps the implementation compatible with both CommonJS and
// newer Node runtimes.
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

exports.verify = async (token, remoteIp) => {
  const cfg = await socialLoginConfigService.getSettings();
  const recaptcha = cfg?.recaptcha || {};
  if (!recaptcha.active) {
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
    console.error('reCAPTCHA verify failed:', err.message);
    return false;
  }
};
