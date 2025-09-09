const mockFlushAll = jest.fn();
const mockClearAll = jest.fn();

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
