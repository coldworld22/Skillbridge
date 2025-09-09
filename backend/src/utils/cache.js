const redisClient = require('./redisClient');
const socketStore = require('./socketStore');

async function clearServerCache() {
  if (redisClient) {
    await redisClient.flushAll();
  }

  if (socketStore && typeof socketStore.clearAll === 'function') {
    await socketStore.clearAll();
  }
}

module.exports = clearServerCache;
