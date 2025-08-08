let url = process.env.FRONTEND_URL || 'http://localhost:3000';
if (url.startsWith('FRONTEND_URL=')) {
  url = url.replace(/^FRONTEND_URL=/, '');
}
const entries = url.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
const defaultOrigins = ['https://eduskillbridge.net', 'https://www.eduskillbridge.net'];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...entries]));
const frontendBase = entries[0] || 'http://localhost:3000';
module.exports = { frontendBase, allowedOrigins };
