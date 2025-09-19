const request = require('supertest');

describe('GET /api/uploads', () => {
  const originalEnv = process.env;

  const loadApp = () => {
    jest.doMock('express-session', () => jest.fn(() => (_req, _res, next) => next()));
    jest.doMock('connect-redis', () => ({
      default: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
    }));
    jest.doMock('../src/config/passport', () => ({
      passport: {
        initialize: () => (_req, _res, next) => next(),
        session: () => (_req, _res, next) => next(),
      },
      initStrategies: jest.fn(),
    }));
    jest.doMock('../src/config/database', () => ({
      connectWithRetry: jest.fn(),
      migrate: { list: jest.fn().mockResolvedValue([[], []]) },
    }));
    jest.doMock('../src/routes', () => {
      const express = require('express');
      return express.Router();
    });
    jest.doMock('../src/jobs', () => jest.fn());
    jest.doMock('../src/middleware/csrf', () => [(_req, _res, next) => next()]);
    jest.doMock('../src/sockets', () => ({
      initSockets: jest.fn(),
      state: { io: {}, rooms: {}, participants: {}, userSockets: {} },
    }));
    jest.doMock('../src/utils/logger.js', () => ({
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));

    const { app } = require('../src/server');
    return app;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
      'postgres://user:pass@localhost:5432/test-db';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it.each([
    ['/api/uploads'],
    ['/api/uploads/'],
  ])('returns 404 without redirecting for %s when no file is requested', async (url) => {
    const app = loadApp();

    const res = await request(app).get(url);

    expect(res.status).toBe(404);
    expect(res.headers.location).toBeUndefined();
    expect(res.body).toEqual({ message: 'Not Found' });
  });

  it.each([
    ['/api/uploads'],
    ['/api/uploads/'],
  ])('returns 404 for HEAD %s requests without redirecting', async (url) => {
    const app = loadApp();

    const res = await request(app).head(url);

    expect(res.status).toBe(404);
    expect(res.headers.location).toBeUndefined();
    expect(res.text).toBeUndefined();
  });
});

