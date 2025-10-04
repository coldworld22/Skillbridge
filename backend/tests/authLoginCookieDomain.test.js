const request = require('supertest');

const payload = { email: 'test@example.com', password: 'StrongPass1!' };

const envKeys = [
  'NODE_ENV',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'SESSION_SECRET',
  'DATABASE_URL',
  'COOKIE_DOMAIN',
];

const originalEnv = envKeys.reduce((acc, key) => {
  acc[key] = process.env[key];
  return acc;
}, {});

const baseEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 'testsecret',
  REFRESH_TOKEN_SECRET: 'refreshsecret',
  SESSION_SECRET: 'sessionsecret',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
};

const routerMocks = [
  '../src/modules/users/user.routes',
  '../src/modules/verify/verify.routes',
  '../src/modules/license/license.routes',
  '../src/modules/users/tutorials/certificate/certificatePublic.routes',
  '../src/modules/users/tutorials/certificate/certificateAdmin.routes',
  '../src/modules/certificateTemplates/certificateTemplates.routes',
  '../src/modules/roles/roles.routes',
  '../src/modules/plans/plans.routes',
  '../src/modules/subscriptions/subscriptions.routes',
];

const setEnv = (cookieDomain) => {
  Object.entries(baseEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });

  if (cookieDomain === undefined || cookieDomain === null || cookieDomain === '') {
    delete process.env.COOKIE_DOMAIN;
  } else {
    process.env.COOKIE_DOMAIN = cookieDomain;
  }
};

const mockDependencies = () => {
  jest.doMock('../src/config/database', () => ({
    raw: jest.fn(() => Promise.resolve()),
  }));

  jest.doMock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }));

  jest.doMock('../src/modules/auth/services/auth.service', () => ({
    loginUser: jest.fn(),
  }));

  jest.doMock('../src/modules/socialLoginConfig/socialLoginConfig.service', () => ({
    getSettings: jest.fn().mockResolvedValue({ recaptcha: { active: false } }),
  }));

  jest.doMock('../src/modules/recaptcha/recaptcha.service', () => ({
    verify: jest.fn(),
    shouldBypass: jest.fn().mockReturnValue(false),
  }));

  routerMocks.forEach((modulePath) => {
    jest.doMock(modulePath, () => require('express').Router());
  });
};

const createApp = async ({ cookieDomain } = {}) => {
  jest.resetModules();
  setEnv(cookieDomain);
  mockDependencies();

  const express = require('express');
  const routes = require('../src/routes/auth');
  const errorHandler = require('../src/middleware/errorHandler');
  const authService = require('../src/modules/auth/services/auth.service');

  authService.loginUser.mockResolvedValue({
    accessToken: 'a',
    refreshToken: 'r',
    user: { id: 1 },
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.csrfToken = jest.fn(() => 'csrf-token');
    next();
  });
  app.use(routes);
  app.use(errorHandler);

  return app;
};

describe('POST /api/auth/login cookie domain handling', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    envKeys.forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  it('omits cookie domain when COOKIE_DOMAIN is not set', async () => {
    const app = await createApp();
    const res = await request(app).post('/api/auth/login').send(payload);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => /Domain=/i.test(cookie))).toBe(false);
  });

  it('applies explicit COOKIE_DOMAIN to refresh and csrf cookies', async () => {
    const app = await createApp({ cookieDomain: '.example.com' });
    const res = await request(app).post('/api/auth/login').send(payload);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    const refreshCookies = cookies.filter((cookie) => cookie.startsWith('refreshToken='));
    const csrfCookies = cookies.filter((cookie) => cookie.startsWith('csrfToken='));

    expect(refreshCookies.length).toBeGreaterThan(0);
    expect(csrfCookies.length).toBeGreaterThan(0);
    expect(refreshCookies.every((cookie) => cookie.includes('Domain=.example.com'))).toBe(true);
    expect(csrfCookies.every((cookie) => cookie.includes('Domain=.example.com'))).toBe(true);
  });
});
