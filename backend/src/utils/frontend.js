let url = process.env.FRONTEND_URL || 'http://localhost:3000';
if (url.startsWith('FRONTEND_URL=')) {
  url = url.replace(/^FRONTEND_URL=/, '');
}
const frontendBase = url.split(',')[0].trim();
module.exports = { frontendBase };
