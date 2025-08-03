const csrf = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const tokenCookie = req.cookies?.csrfToken;
  const tokenHeader = req.get('x-csrf-token');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!tokenCookie || !tokenHeader || tokenCookie !== tokenHeader) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};

module.exports = csrf;
