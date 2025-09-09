const mockFlushAll = jest.fn();
const mockClearAll = jest.fn();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt';
process.env.REFRESH_TOKEN_SECRET = 'refresh';
process.env.SESSION_SECRET = 'session';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

jest.mock('../src/utils/redisClient', () => ({ flushAll: mockFlushAll }));
jest.mock('../src/utils/socketStore', () => ({ clearAll: mockClearAll }));

const { clearServerCache } = require('../src/server');

describe('clearServerCache', () => {
  beforeEach(() => {
    mockFlushAll.mockClear();
    mockClearAll.mockClear();
  });

  it('flushes redis and clears memory caches', async () => {
    await clearServerCache();
    expect(mockFlushAll).toHaveBeenCalled();
    expect(mockClearAll).toHaveBeenCalled();
  });
});
