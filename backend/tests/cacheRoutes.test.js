const request = require('supertest');
const express = require('express');

const mockClearServerCache = jest.fn();
jest.mock('../src/utils/cache', () => mockClearServerCache);
jest.mock('../src/middleware/requireAdmin', () => (_req, _res, next) => next());

const cacheRoutes = require('../src/routes/cache.routes');

function createApp() {
  const app = express();
  app.use('/api/admin/cache', cacheRoutes);
  return app;
}

describe('Cache routes', () => {
  beforeEach(() => {
    mockClearServerCache.mockReset();
    global.clearServerCache = mockClearServerCache;
  });

  it('returns success when cache is cleared', async () => {
    mockClearServerCache.mockResolvedValue();
    const app = createApp();
    const res = await request(app).post('/api/admin/cache/clear');
    expect(mockClearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      message: 'Cache cleared',
    });
  });

  it('returns error when cache clearing fails', async () => {
    mockClearServerCache.mockRejectedValue(new Error('fail'));
    const app = createApp();
    const res = await request(app).post('/api/admin/cache/clear');
    expect(mockClearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Failed to clear cache',
    });
  });
});
