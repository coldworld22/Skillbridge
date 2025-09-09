const cache = require('../src/utils/cache');

describe('cache utility', () => {
  afterEach(async () => {
    await cache.clear();
  });

  it('stores and retrieves values', () => {
    cache.set('foo', 'bar');
    expect(cache.get('foo')).toBe('bar');
  });

  it('deletes values', () => {
    cache.set('foo', 'bar');
    cache.del('foo');
    expect(cache.get('foo')).toBeUndefined();
  });

  it('clears all values', async () => {
    cache.set('foo', 'bar');
    await cache.clear();
    expect(cache.get('foo')).toBeUndefined();
  });
});

