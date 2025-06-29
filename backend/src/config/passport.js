const passport = require('passport');

// Google login is disabled until production deployment
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Facebook login is disabled until production deployment
// const FacebookStrategy = require('passport-facebook').Strategy;
// Apple login is disabled until production deployment
// const AppleStrategy = require('passport-apple').Strategy;

const socialAuthService = require('../modules/auth/services/socialAuth.service');
const socialLoginConfigService = require('../modules/socialLoginConfig/socialLoginConfig.service');

let initialized = false;

async function initStrategies() {
  const cfg = await socialLoginConfigService.getSettings();
  const providers = cfg?.providers || {};

  // Google login is temporarily disabled until the project is deployed
  // const google = providers.google || {};
  // if ((google.active ?? true) && (google.clientId || process.env.GOOGLE_CLIENT_ID)) {
  //   passport.use(
  //     'google',
  //     new GoogleStrategy(
  //       {
  //         clientID: google.clientId || process.env.GOOGLE_CLIENT_ID || '',
  //         clientSecret: google.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
  //         callbackURL: '/api/auth/google/callback',
  //       },
  //       async (_accessToken, _refreshToken, profile, done) => {
  //         try {
  //           const { id, displayName, emails } = profile;
  //           const email = emails && emails[0] && emails[0].value;
  //           const result = await socialAuthService.loginOrRegister({
  //             provider: 'google',
  //             providerId: id,
  //             email,
  //             fullName: displayName,
  //           });
  //           return done(null, result);
  //         } catch (err) {
  //           return done(err);
  //         }
  //       }
  //     )
  //   );
  // }

  // Facebook login is temporarily disabled until the project is deployed
  // const facebook = providers.facebook || {};
  // if (facebook.active && (facebook.clientId || process.env.FACEBOOK_CLIENT_ID)) {
  //   passport.use(
  //     'facebook',
  //     new FacebookStrategy(
  //       {
  //         clientID: facebook.clientId || process.env.FACEBOOK_CLIENT_ID || '',
  //         clientSecret: facebook.clientSecret || process.env.FACEBOOK_CLIENT_SECRET || '',
  //         callbackURL: '/api/auth/facebook/callback',
  //         profileFields: ['id', 'displayName', 'email'],
  //       },
  //       async (_accessToken, _refreshToken, profile, done) => {
  //         try {
  //           const { id, displayName, emails } = profile;
  //           const email = emails && emails[0] && emails[0].value;
  //           const result = await socialAuthService.loginOrRegister({
  //             provider: 'facebook',
  //             providerId: id,
  //             email,
  //             fullName: displayName,
  //           });
  //           return done(null, result);
  //         } catch (err) {
  //           return done(err);
  //         }
  //       }
  //     )
  //   );
  // }

  // Apple login is temporarily disabled until the project is deployed
  // const apple = providers.apple || {};
  // if (
  //   apple.active &&
  //   (apple.clientId || process.env.APPLE_CLIENT_ID) &&
  //   (apple.teamId || process.env.APPLE_TEAM_ID) &&
  //   (apple.keyId || process.env.APPLE_KEY_ID)
  // ) {
  //   passport.use(
  //     'apple',
  //     new AppleStrategy(
  //       {
  //         clientID: apple.clientId || process.env.APPLE_CLIENT_ID || '',
  //         teamID: apple.teamId || process.env.APPLE_TEAM_ID || '',
  //         keyID: apple.keyId || process.env.APPLE_KEY_ID || '',
  //         callbackURL: '/api/auth/apple/callback',
  //         privateKeyString: ((apple.privateKey || process.env.APPLE_PRIVATE_KEY) || '').replace(/\\n/g, '\n'),
  //         scope: ['name', 'email'],
  //       },
  //       async (_accessToken, _refreshToken, idToken, profile, done) => {
  //         try {
  //           const { sub, email } = idToken || {};
  //           const fullName = profile?.name
  //             ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim()
  //             : 'User';
  //           const result = await socialAuthService.loginOrRegister({
  //             provider: 'apple',
  //             providerId: sub,
  //             email,
  //             fullName,
  //           });
  //           return done(null, result);
  //         } catch (err) {
  //           return done(err);
  //         }
  //       }
  //     )
  //   );
  // }
  initialized = true;
}

module.exports = { passport, initStrategies };

