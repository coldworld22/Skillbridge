const socialLoginConfigService = require('../socialLoginConfig/socialLoginConfig.service');

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
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
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
