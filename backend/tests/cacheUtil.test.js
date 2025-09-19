const cache = require('../src/utils/cache');

describe('cache utility', () => {
  afterEach(async () => {
    await cache.clear();
    jest.useRealTimers();
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

  it('expires values after TTL', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    jest.useFakeTimers({ now: start });

    cache.set('foo', 'bar', { ttl: 1 });
    expect(cache.get('foo')).toBe('bar');

    jest.setSystemTime(new Date(start.getTime() + 1000));
    expect(cache.get('foo')).toBeUndefined();
  });
});

