exports.seed = async function (knex) {
  await knex('settings').where({ key: 'social_login_settings' }).del();
  const now = new Date();
  const config = {
    enabled: true,
    providers: {
      google: {
        active: true,
        clientId: '707378564878-smi89kqne0snc1usv9s1l465hs6lb9a0.apps.googleusercontent.com',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        redirectUrl: 'https://www.eduskillbridge.net/api/auth/google/callback',
        label: 'Sign in with Google',
        icon: 'google'
      }
    },
    recaptcha: {
      active: false,
      siteKey: '',
      secretKey: ''
    }
  };
  await knex('settings').insert({
    key: 'social_login_settings',
    value: JSON.stringify(config),
    created_at: now,
    updated_at: now,
  });
};
