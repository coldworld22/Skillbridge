// Import the configured passport instance
const { passport } = require('../../../config/passport');
const { refreshCookieOptions, accessCookieOptions } = require('../../../utils/cookie');
const { frontendBase, allowedOrigins } = require('../../../utils/frontend');

// Shared callback handler for social auth providers
const handleCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${frontendBase}/auth/login?error=social`);
    }
    const { refreshToken, accessToken } = result;
    res
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .cookie('token', accessToken, accessCookieOptions);
    let origin = req.query.origin;
    if (!allowedOrigins.includes(origin)) {
      const headerOrigin = req.get('origin');
      origin = allowedOrigins.includes(headerOrigin) ? headerOrigin : frontendBase;
    }
    const redirectUrl = `${origin}/auth/social-success`;
    res.redirect(redirectUrl);
  })(req, res, next);
};


// Google OAuth
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleCallback = handleCallback('google');

// Facebook OAuth
exports.facebookAuth = passport.authenticate('facebook', { scope: ['email'] });

exports.facebookCallback = handleCallback('facebook');

// Apple OAuth
exports.appleAuth = passport.authenticate('apple', { scope: ['name', 'email'] });

exports.appleCallback = handleCallback('apple');

// GitHub OAuth
exports.githubAuth = passport.authenticate('github', { scope: ['user:email'] });

exports.githubCallback = handleCallback('github');
