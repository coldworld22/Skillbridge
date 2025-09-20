const request = require('supertest');

jest.mock('../../routes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/test-route', (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return router;
});

jest.mock('../../config/passport', () => ({
  passport: {
    initialize: () => (req, _res, next) => next(),
    session: () => (req, _res, next) => next(),
  },
  initStrategies: jest.fn(),
}));

jest.mock('../../utils/logger.js', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

const loadApp = () => {
  const { app } = require('../../server');
  return app;
};

describe('global rate limiter', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      SESSION_SECRET: 'test-session-secret',
      JWT_SECRET: 'jwt-secret',
      REFRESH_TOKEN_SECRET: 'refresh-secret',
      TEST_DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
      RATE_LIMIT_MAX_REQUESTS: '3',
      RATE_LIMIT_WINDOW_MINUTES: '1',
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('allows requests up to the configured threshold and blocks additional attempts', async () => {
    const app = loadApp();

    for (let i = 0; i < 3; i += 1) {
      const response = await request(app).get('/test-route');
      expect(response.status).toBe(200);
    }

    const blocked = await request(app).get('/test-route');
    expect(blocked.status).toBe(429);
  });

  it('ignores health checks while enforcing a higher custom threshold', async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = '5';
    const app = loadApp();

    for (let i = 0; i < 6; i += 1) {
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);
    }

    for (let i = 0; i < 5; i += 1) {
      const response = await request(app).get('/test-route');
      expect(response.status).toBe(200);
    }

    const blocked = await request(app).get('/test-route');
    expect(blocked.status).toBe(429);
  });
});
