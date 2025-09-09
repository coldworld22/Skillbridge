const cache = require('../src/utils/cache');
describe('cache utility', () => {
  afterEach(async () => {
    await cache.clear();
    delete global.clearServerCache;
  });

  it('clears stored values via clear()', async () => {
    cache.set('foo', 'bar');
    await cache.clear();
    expect(cache.get('foo')).toBeUndefined();
  });

  it('clears store through global.clearServerCache', async () => {
    cache.set('baz', 'qux');
    global.clearServerCache = cache.clear;
    await global.clearServerCache();
    expect(cache.get('baz')).toBeUndefined();
  });
});
