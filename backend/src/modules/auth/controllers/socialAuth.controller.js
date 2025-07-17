// Import the configured passport instance
const { passport } = require('../../../config/passport');
const { refreshCookieOptions } = require('../../../utils/cookie');


// Google OAuth
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/login?error=social`);
    }
    const { accessToken, refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    const redirectUrl = `${process.env.FRONTEND_URL || ''}/auth/social-success?token=${accessToken}`;
    res.redirect(redirectUrl);
  })(req, res, next);
};

// Facebook OAuth is disabled until the project is hosted
// exports.facebookAuth = passport.authenticate('facebook', { scope: ['email'] });

// exports.facebookCallback = (req, res, next) => {
//   passport.authenticate('facebook', { session: false }, (err, result) => {
//     if (err || !result) {
//       return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/login?error=social`);
//     }
//     const { accessToken, refreshToken } = result;
//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//     const redirectUrl = `${process.env.FRONTEND_URL || ''}/auth/social-success?token=${accessToken}`;
//     res.redirect(redirectUrl);
//   })(req, res, next);
// };

// Apple OAuth is disabled until the project is hosted
// exports.appleAuth = passport.authenticate('apple');

// exports.appleCallback = (req, res, next) => {
//   passport.authenticate('apple', { session: false }, (err, result) => {
//     if (err || !result) {
//       return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/login?error=social`);
//     }
//     const { accessToken, refreshToken } = result;
//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//     const redirectUrl = `${process.env.FRONTEND_URL || ''}/auth/social-success?token=${accessToken}`;
//     res.redirect(redirectUrl);
//   })(req, res, next);
// };

// GitHub OAuth
exports.githubAuth = passport.authenticate('github', { scope: ['user:email'] });

exports.githubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, result) => {
    if (err || !result) {
      return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/login?error=social`);
    }
    const { accessToken, refreshToken } = result;
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    const redirectUrl = `${process.env.FRONTEND_URL || ''}/auth/social-success?token=${accessToken}`;
    res.redirect(redirectUrl);
  })(req, res, next);
};
