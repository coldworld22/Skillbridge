const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
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

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails && emails[0] && emails[0].value;
        const result = await socialAuthService.loginOrRegister({
          provider: 'facebook',
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

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID || '',
      teamID: process.env.APPLE_TEAM_ID || '',
      keyID: process.env.APPLE_KEY_ID || '',
      callbackURL: '/api/auth/apple/callback',
      privateKeyString: (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      scope: ['name', 'email'],
    },
    async (_accessToken, _refreshToken, idToken, profile, done) => {
      try {
        const { sub, email } = idToken || {};
        const fullName = profile?.name ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim() : 'User';
        const result = await socialAuthService.loginOrRegister({
          provider: 'apple',
          providerId: sub,
          email,
          fullName,
        });
        return done(null, result);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
