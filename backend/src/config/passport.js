const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const socialAuthService = require('../modules/auth/services/socialAuth.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails && emails[0] && emails[0].value;
        const result = await socialAuthService.loginOrRegister({
          provider: 'google',
          providerId: id,
          email,
          fullName: displayName,
        });
        return done(null, result);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
