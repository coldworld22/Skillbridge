const request = require('supertest');
const express = require('express');

const logger = require('../src/utils/logger');

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
process.env.SESSION_SECRET = 'sessionsecret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  loginUser: jest.fn(),
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

const authService = require('../src/modules/auth/services/auth.service');
const routes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.csrfToken = jest.fn(() => {
    if (req.headers['x-force-csrf-error']) {
      throw new Error('csrf failure');
    }
    return 'csrf-token';
  });
  next();
});
app.use(routes);
app.use(errorHandler);

describe('POST /api/auth/login', () => {
  const payload = { email: 'test@example.com', password: 'StrongPass1!' };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('logs in a user successfully', async () => {
    authService.loginUser.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: { id: 1 } });
    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.status).toBe(200);
    expect(authService.loginUser).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(res.body.accessToken).toBe('a');
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringMatching(/^refreshToken=r/)]));
  });

  it('skips csrf cookie and logs warning when csrf helper missing', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    authService.loginUser.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: { id: 1 } });

    const res = await request(app).post('/api/auth/login').send(payload);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.startsWith('csrfToken='))).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/CSRF token helper missing on login request; skipping csrfToken cookie/)
    );
  });

  it('returns 401 for invalid credentials', async () => {
    const AppError = require('../src/utils/AppError');
    authService.loginUser.mockRejectedValue(new AppError('Invalid credentials', 401));
    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('locks out after too many failed attempts', async () => {
    const AppError = require('../src/utils/AppError');
    authService.loginUser.mockRejectedValue(new AppError('Too many failed login attempts. Try again later.', 429));
    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many failed login attempts/i);
  });

  it('still succeeds when csrf token generation fails', async () => {
    authService.loginUser.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: { id: 1 } });
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-force-csrf-error', '1')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('a');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^refreshToken=r/)]),
    );
    expect(res.headers['set-cookie']).toEqual(
      expect.not.arrayContaining([expect.stringMatching(/^csrfToken=/)]),
    );
  });
});
