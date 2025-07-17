const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (process.env.COOKIE_DOMAIN) {
  refreshCookieOptions.domain = process.env.COOKIE_DOMAIN;
}

module.exports = { refreshCookieOptions };
