// Import the configured passport instance
const { passport } = require('../../../config/passport');
const { refreshCookieOptions } = require('../../../utils/cookie');
const { frontendBase, allowedOrigins } = require('../../../utils/frontend');


// Google OAuth
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    let origin = req.query.origin;
    if (!allowedOrigins.includes(origin)) {
      const headerOrigin = req.get('origin');
      origin = allowedOrigins.includes(headerOrigin) ? headerOrigin : frontendBase;
    }
    const redirectUrl = `${origin}/auth/social-success`;
    res.redirect(redirectUrl);
  })(req, res, next);
};

// Facebook OAuth
exports.facebookAuth = passport.authenticate('facebook', { scope: ['email'] });

exports.facebookCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    let origin = req.query.origin;
    if (!allowedOrigins.includes(origin)) {
      const headerOrigin = req.get('origin');
      origin = allowedOrigins.includes(headerOrigin) ? headerOrigin : frontendBase;
    }
    const redirectUrl = `${origin}/auth/social-success`;
    res.redirect(redirectUrl);
  })(req, res, next);
};

// Apple OAuth
exports.appleAuth = passport.authenticate('apple', { scope: ['name', 'email'] });

exports.appleCallback = (req, res, next) => {
  passport.authenticate('apple', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    let origin = req.query.origin;
    if (!allowedOrigins.includes(origin)) {
      const headerOrigin = req.get('origin');
      origin = allowedOrigins.includes(headerOrigin) ? headerOrigin : frontendBase;
    }
    const redirectUrl = `${origin}/auth/social-success`;
    res.redirect(redirectUrl);
  })(req, res, next);
};

// GitHub OAuth
exports.githubAuth = passport.authenticate('github', { scope: ['user:email'] });

exports.githubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    let origin = req.query.origin;
    if (!allowedOrigins.includes(origin)) {
      const headerOrigin = req.get('origin');
      origin = allowedOrigins.includes(headerOrigin) ? headerOrigin : frontendBase;
    }
    const redirectUrl = `${origin}/auth/social-success`;
    res.redirect(redirectUrl);
  })(req, res, next);
};
