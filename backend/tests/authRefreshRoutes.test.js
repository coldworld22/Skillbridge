const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const logger = require('../src/utils/logger');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
process.env.SESSION_SECRET = 'sessionsecret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  loginUser: jest.fn(),
  rotateRefreshToken: jest.fn(),
  generateAccessToken: jest.fn(),
}));

jest.mock('../src/modules/socialLoginConfig/socialLoginConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({ recaptcha: { active: false } }),
}));

jest.mock('../src/modules/recaptcha/recaptcha.service', () => ({
  verify: jest.fn(),
  shouldBypass: jest.fn().mockReturnValue(false),
}));

// Mock unrelated grouped routes
jest.mock('../src/modules/users/user.routes', () => require('express').Router());
jest.mock('../src/modules/verify/verify.routes', () => require('express').Router());
jest.mock('../src/modules/license/license.routes', () => require('express').Router());
jest.mock('../src/modules/users/tutorials/certificate/certificatePublic.routes', () => require('express').Router());
jest.mock('../src/modules/users/tutorials/certificate/certificateAdmin.routes', () => require('express').Router());
jest.mock('../src/modules/certificateTemplates/certificateTemplates.routes', () => require('express').Router());
jest.mock('../src/modules/roles/roles.routes', () => require('express').Router());
jest.mock('../src/modules/plans/plans.routes', () => require('express').Router());
jest.mock('../src/modules/subscriptions/subscriptions.routes', () => require('express').Router());

const csrf = require('../src/middleware/csrf');
const authService = require('../src/modules/auth/services/auth.service');
const authController = require('../src/modules/auth/controllers/auth.controller');
const routes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(cookieParser());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(express.json());
app.use(csrf);
app.use(routes);
app.use(errorHandler);

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const getCsrf = async () => {
    const res = await request(app).get('/api/auth/refresh');
    const cookies = res.headers['set-cookie'] || [];
    const sessionCookie = cookies.find((c) => c.startsWith('connect.sid'));
    const csrfCookie = cookies.find((c) => c.startsWith('csrfToken='));
    const csrfToken = csrfCookie?.split(';')[0].split('=')[1];
    return { sessionCookie, csrfCookie, csrfToken };
  };

  const createAppWithEnvOverrides = (overrides = {}) => {
    const originalEnv = { ...process.env };
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });

    let result;

    jest.isolateModules(() => {
      const isolatedExpress = require('express');
      const isolatedCookieParser = require('cookie-parser');
      const isolatedSession = require('express-session');
      const isolatedCsrf = require('../src/middleware/csrf');
      const isolatedRoutes = require('../src/routes/auth');
      const isolatedErrorHandler = require('../src/middleware/errorHandler');
      const isolatedAuthService = require('../src/modules/auth/services/auth.service');

      const isolatedApp = isolatedExpress();
      isolatedApp.use(isolatedCookieParser());
      isolatedApp.use(
        isolatedSession({ secret: 'test', resave: false, saveUninitialized: true })
      );
      isolatedApp.use(isolatedExpress.json());
      isolatedApp.use(isolatedCsrf);
      isolatedApp.use(isolatedRoutes);
      isolatedApp.use(isolatedErrorHandler);

      result = { app: isolatedApp, authService: isolatedAuthService };
    });

    Object.keys(process.env).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) {
        delete process.env[key];
      }
    });

    Object.entries(originalEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });

    return result;
  };

  it('refreshes token with refresh cookie', async () => {
    authService.rotateRefreshToken.mockResolvedValue({
      decoded: { id: 1, role: 'User' },
      refreshToken: 'newR',
    });
    authService.generateAccessToken.mockReturnValue('newA');
    const { sessionCookie, csrfCookie, csrfToken } = await getCsrf();

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=r`, sessionCookie, csrfCookie])
      .set('x-csrf-token', csrfToken);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBe('newA');
    expect(authService.rotateRefreshToken).toHaveBeenCalledWith('r');
    expect(refreshRes.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('csrfToken='),
      ])
    );
  });

  it('rejects invalid refresh token', async () => {
    authService.rotateRefreshToken.mockRejectedValue(new Error('bad token'));

    const { sessionCookie, csrfCookie, csrfToken } = await getCsrf();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=bad`, sessionCookie, csrfCookie])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
    const clearedCookies = res.headers['set-cookie'] || [];
    expect(clearedCookies.some((cookie) => cookie.startsWith('refreshToken=;'))).toBe(true);
    expect(clearedCookies.some((cookie) => cookie.startsWith('csrfToken=;'))).toBe(true);
  });

  it('rejects refresh without CSRF token', async () => {
    const { sessionCookie } = await getCsrf();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=r`, sessionCookie]);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/invalid csrf token/i);
    expect(authService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('skips csrf cookie and logs warning when helper missing after verification', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    authService.rotateRefreshToken.mockResolvedValue({
      decoded: { id: 1, role: 'User' },
      refreshToken: 'newR',
    });
    authService.generateAccessToken.mockReturnValue('newA');

    const missingCsrfApp = express();
    missingCsrfApp.use(cookieParser());
    missingCsrfApp.use(express.json());
    missingCsrfApp.post('/api/auth/refresh', (req, res, next) => {
      req.csrfToken = undefined;
      return authController.refreshToken(req, res, next);
    });
    missingCsrfApp.use(errorHandler);

    const res = await request(missingCsrfApp)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=r']);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.startsWith('csrfToken='))).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/CSRF token helper missing on refresh request.*skipping csrfToken cookie/i)
    );
  });

  it('allows refresh over HTTP when COOKIE_SECURE=false', async () => {
    const { app: insecureApp, authService: insecureAuthService } =
      createAppWithEnvOverrides({ COOKIE_SECURE: 'false' });

    insecureAuthService.rotateRefreshToken.mockResolvedValue({
      decoded: { id: 1, role: 'User' },
      refreshToken: 'newR',
    });
    insecureAuthService.generateAccessToken.mockReturnValue('newA');

    const csrfRes = await request(insecureApp).get('/api/auth/refresh');
    const cookies = csrfRes.headers['set-cookie'] || [];
    const sessionCookie = cookies.find((c) => c.startsWith('connect.sid'));
    const csrfCookie = cookies.find((c) => c.startsWith('csrfToken='));
    const csrfToken = csrfCookie?.split(';')[0].split('=')[1];

    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).not.toContain('Secure');

    const refreshRes = await request(insecureApp)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=r`, sessionCookie, csrfCookie])
      .set('x-csrf-token', csrfToken);

    expect(refreshRes.status).toBe(200);
    expect(insecureAuthService.rotateRefreshToken).toHaveBeenCalledWith('r');
  });
});
