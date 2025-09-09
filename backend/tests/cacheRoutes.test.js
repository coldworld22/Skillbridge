const request = require('supertest');
const express = require('express');

jest.mock('../src/middleware/requireAdmin', () => (req, res, next) => next());

function createApp() {
  const app = express();
  app.use('/api/cache', require('../src/routes/cache.routes'));
  return app;
}

describe('Cache routes', () => {
  let mockClearServerCache;

  beforeEach(() => {
    mockClearServerCache = jest.fn();
    global.clearServerCache = mockClearServerCache;
  });

  afterEach(() => {
    delete global.clearServerCache;
  });

  it('returns success when cache is cleared', async () => {
    mockClearServerCache.mockResolvedValue();
    const app = createApp();
    const res = await request(app).post('/api/admin/cache/clear');
    expect(mockClearServerCache).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'cleared',
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
