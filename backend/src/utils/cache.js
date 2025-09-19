const redisClient = require('./redisClient');
const socketStore = require('./socketStore');

const store = new Map();

const normalizeTtl = (options) => {
  if (!options) return null;
  if (typeof options === 'number') {
    return Number.isFinite(options) && options > 0 ? options * 1000 : null;
  }

  if (typeof options === 'object') {
    const { ttl } = options;
    if (Number.isFinite(ttl) && ttl > 0) {
      return ttl * 1000;
    }
  }

  return null;
};

module.exports = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;

    const { value, expiresAt } = entry;
    if (expiresAt && expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }

    return value;
  },
  set(key, value, options = null) {
    const ttlMs = normalizeTtl(options);
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    store.set(key, { value, expiresAt });
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
  },
};

