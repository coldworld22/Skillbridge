exports.seed = async function (knex) {
  await knex('settings').where({ key: 'social_login_settings' }).del();
  const now = new Date();
  const config = {
    enabled: false,
    providers: {
      google: {
        active: false,
        clientId: '',
        clientSecret: '',
        redirectUrl: '',
        label: 'Sign in with Google',
        icon: 'google'
      },
      facebook: {
        active: false,
        clientId: '',
        clientSecret: '',
        redirectUrl: '',
        label: 'Sign in with Facebook',
        icon: 'facebook'
      },
      github: {
        active: false,
        clientId: '',
        clientSecret: '',
        redirectUrl: '',
        label: 'Sign in with GitHub',
        icon: 'github'
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
    updated_at: now
  });
};
