const request = require('supertest');

describe('GET /api/health', () => {
  const originalEnv = process.env;

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
  });

  it('responds with 200 even when the session store is unavailable', async () => {
    const sessionHandler = jest.fn((req, res, next) => {
      const error = new Error('Session store unavailable');
      next(error);
    });
    const sessionMock = jest.fn(() => sessionHandler);

    jest.doMock('express-session', () => sessionMock);
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

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(sessionHandler).not.toHaveBeenCalled();
    expect(sessionMock).toHaveBeenCalledWith(expect.objectContaining({ secret: expect.any(String) }));
  });
});

