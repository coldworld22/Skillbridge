const request = require('supertest');
const express = require('express');

jest.mock('../src/middleware/requireAdmin', () => (_req, _res, next) => next());

const cacheRoutes = require('../src/routes/cache.routes');

function createApp() {
  const app = express();
  app.use('/api/cache', require('../src/routes/cache.routes'));
  return app;
}

describe('Cache routes', () => {
  afterEach(() => {
    delete global.clearServerCache;
  });
  it('returns success when cache is cleared', async () => {
    global.clearServerCache = jest.fn().mockResolvedValue();
    const app = createApp();
    const res = await request(app).post('/api/cache/clear');
    expect(global.clearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'cleared' });
  });

  it('returns error when cache clearing fails', async () => {
    global.clearServerCache = jest.fn().mockRejectedValue(new Error('fail'));
    const app = createApp();
    const res = await request(app).post('/api/cache/clear');
    expect(global.clearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Failed to clear cache',
    });
  });
});
