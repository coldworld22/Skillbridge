const mockFlushAll = jest.fn();
const mockClearAll = jest.fn();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt';
process.env.REFRESH_TOKEN_SECRET = 'refresh';
process.env.SESSION_SECRET = 'session';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

jest.mock('../src/utils/redisClient', () => ({ flushAll: mockFlushAll }));
jest.mock('../src/utils/socketStore', () => ({ clearAll: mockClearAll }));

const cache = require('../src/utils/cache');

describe('cache.clear', () => {
  beforeEach(() => {
    mockFlushAll.mockClear();
    mockClearAll.mockClear();
  });

  it('flushes redis and clears memory caches', async () => {
    await cache.clear();
    expect(mockFlushAll).toHaveBeenCalled();
    expect(mockClearAll).toHaveBeenCalled();
  });
});
