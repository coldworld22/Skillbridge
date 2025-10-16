const dns = require('dns');
const logger = require('./logger');

function configureDns() {
  const raw = process.env.DNS_SERVERS;
  if (!raw) return;

  const servers = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!servers.length) return;

  try {
    dns.setServers(servers);
    logger.log(`Configured custom DNS servers: ${servers.join(', ')}`);
  } catch (err) {
    logger.error('Failed to apply custom DNS servers:', err.message);
  }
}

configureDns();
