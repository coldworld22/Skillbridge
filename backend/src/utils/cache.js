const redisClient = require('./redisClient');
const socketStore = require('./socketStore');

const store = new Map();

module.exports = {
  get(key) {
    return store.get(key);
  },
  set(key, value) {
    store.set(key, value);
  },
  del(key) {
    store.delete(key);
  },
  async clear() {
    if (redisClient && typeof redisClient.flushAll === 'function') {
      await redisClient.flushAll();
    }
    if (socketStore && typeof socketStore.clearAll === 'function') {
      await socketStore.clearAll();
    }
    store.clear();

    if (redisClient && typeof redisClient.flushAll === 'function') {
      await redisClient.flushAll();
    }

    if (socketStore && typeof socketStore.clearAll === 'function') {
      await socketStore.clearAll();
    }
  },
};

