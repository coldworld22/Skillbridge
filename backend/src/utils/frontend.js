let url = process.env.FRONTEND_URL || 'http://localhost:3000';
if (url.startsWith('FRONTEND_URL=')) {
  url = url.replace(/^FRONTEND_URL=/, '');
}
const entries = url
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const APP_DOMAIN = process.env.APP_DOMAIN;
const defaultOrigins = APP_DOMAIN
  ? [`https://${APP_DOMAIN}`, `https://www.${APP_DOMAIN}`]
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...entries]));
const frontendBase =
  entries[0] || (APP_DOMAIN ? `https://${APP_DOMAIN}` : 'http://localhost:3000');
module.exports = { frontendBase, allowedOrigins };
