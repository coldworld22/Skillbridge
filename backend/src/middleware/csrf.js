const csrf = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const exempt = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/request-reset',
    '/api/auth/forgot-password',
    '/api/auth/verify-otp',
    '/api/auth/reset-password',
  ];

  const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const isAdTracking = /^\/api\/ads\/[^/]+\/(view|click)$/.test(req.path);
  if (!unsafe.includes(req.method) || exempt.includes(req.path) || isAdTracking) {
    return next();
  }

  const tokenCookie = req.cookies?.csrfToken;
  const tokenHeader = req.get('x-csrf-token');
  if (!tokenCookie || !tokenHeader || tokenCookie !== tokenHeader) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
};

module.exports = csrf;
