const request = require('supertest');

jest.setTimeout(10000);

function loadServer() {
  jest.resetModules();
  jest.doMock('../src/routes', () => {
    const express = require('express');
    const router = express.Router();
    router.get('/api/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    router.get('/api/normal', (_req, res) => {
      res.status(200).json({ ok: true });
    });
    return router;
  });
  jest.doMock('../src/middleware/errorHandler', () => (_err, _req, res, _next) => {
    res.status(500).json({ message: 'error' });
  });
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test';
  process.env.REFRESH_TOKEN_SECRET = 'test';
  process.env.SESSION_SECRET = 'test';
  process.env.TEST_DATABASE_URL = 'postgresql://localhost/testdb';
  delete process.env.REDIS_URL;
  return require('../src/server');
}

function closeServer(serverInstance) {
  if (global.io && typeof global.io.close === 'function') {
    global.io.close();
    global.io = undefined;
  }
  if (serverInstance && typeof serverInstance.close === 'function') {
    serverInstance.close();
  }
}

describe('global rate limiter', () => {
  it('limits repeated requests to non-health endpoints', async () => {
    const { app, server } = loadServer();
    try {
      const agent = request(app);

      for (let i = 0; i < 100; i += 1) {
        const res = await agent.get('/api/not-real');
        expect(res.status).toBe(404);
      }

      const limitedResponse = await agent.get('/api/not-real');
      expect(limitedResponse.status).toBe(429);
    } finally {
      closeServer(server);
    }
  });

  it('skips health endpoint from rate limiting', async () => {
    const { app, server } = loadServer();
    try {
      const agent = request(app);

      for (let i = 0; i < 120; i += 1) {
        const res = await agent.get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
      }
    } finally {
      closeServer(server);
    }
  });
});

