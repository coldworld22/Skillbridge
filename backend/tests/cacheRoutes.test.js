const request = require('supertest');
const express = require('express');

jest.mock('../src/middleware/requireAdmin', () => (_req, _res, next) => next());
jest.mock('../src/server', () => ({
  clearServerCache: jest.fn(),
}));

const cacheRoutes = require('../src/routes/cache.routes');
const { clearServerCache } = require('../src/server');

function createApp() {
  const app = express();
  app.use('/api/cache', cacheRoutes);
  return app;
}

describe('Cache routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('returns success when cache is cleared', async () => {
    clearServerCache.mockResolvedValue();
    const app = createApp();
    const res = await request(app).post('/api/cache/clear');
    expect(clearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', message: 'Cache cleared' });
  });

  it('returns error when cache clearing fails', async () => {
    clearServerCache.mockRejectedValue(new Error('fail'));
    const app = createApp();
    const res = await request(app).post('/api/cache/clear');
    expect(clearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Failed to clear cache',
    });
  });
});
