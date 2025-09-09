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
    store.clear();
  },
};
