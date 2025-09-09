const { createClient } = require('redis');

let client = null;
if (process.env.REDIS_URL) {
  client = createClient({ url: process.env.REDIS_URL });
}

module.exports = client;
