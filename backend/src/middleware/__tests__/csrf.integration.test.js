const request = require('supertest');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

process.env.NODE_ENV = 'development';
process.env.SESSION_SECRET = 'test-secret';
process.env.JWT_SECRET = 'jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'refresh-secret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

jest.mock('../../modules/auth/services/auth.service', () => ({
  loginUser: jest.fn().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 1, email: 'user@example.com' },
  }),
  rotateRefreshToken: jest.fn().mockResolvedValue({
    decoded: { id: 1, roles: ['Student'], jti: 'jti-123' },
    refreshToken: 'rotated-refresh-token',
  }),
  generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
  verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, jti: 'jti-123' }),
  revokeRefreshToken: jest.fn().mockResolvedValue(),
}));

jest.mock('../../modules/socialLoginConfig/socialLoginConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({ recaptcha: { active: false } }),
}));

jest.mock('../../modules/recaptcha/recaptcha.service', () => ({
  shouldBypass: jest.fn().mockReturnValue(true),
  verify: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../modules/users/user.model', () => ({
  updateUser: jest.fn().mockResolvedValue(),
}));

jest.mock('../../middleware/rateLimiter', () => ({
  limitAuthRequests: (req, res, next) => next(),
}));

jest.mock('../../middleware/auth/authMiddleware', () => ({
  addTokenToBlacklist: jest.fn().mockResolvedValue(),
}));

const csrfMiddleware = require('../csrf');
const authRoutes = require('../../modules/auth/routes/auth.routes');
const csrfRoutes = require('../../routes/csrf.routes');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(csrfMiddleware);
  app.use('/api/csrf-token', csrfRoutes);
  app.use('/api/auth', authRoutes);
  return app;
};

const extractCookie = (res, name) => {
  const header = res.headers['set-cookie'] || [];
  for (const cookie of header) {
    if (cookie.startsWith(`${name}=`)) {
      const value = cookie.split(';')[0].split('=')[1];
      return decodeURIComponent(value);
    }
  }
  return undefined;
};

describe('CSRF middleware integration', () => {
  it('sets csrfToken cookie on CSRF token route and login, and allows refresh/logout with token', async () => {
    const app = createApp();
    const agent = request.agent(app);

    const csrfResponse = await agent.get('/api/csrf-token');
    expect(csrfResponse.status).toBe(200);
    const initialToken = extractCookie(csrfResponse, 'csrfToken');
    expect(initialToken).toBeDefined();
    expect(csrfResponse.body?.token).toBe(initialToken);

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    expect(loginResponse.status).toBe(200);
    const loginToken = extractCookie(loginResponse, 'csrfToken');
    expect(loginToken).toBeDefined();

    const refreshResponse = await agent
      .post('/api/auth/refresh')
      .set('x-csrf-token', loginToken || '')
      .send();
    expect(refreshResponse.status).toBe(200);
    const rotatedToken = extractCookie(refreshResponse, 'csrfToken');
    expect(rotatedToken).toBeDefined();

    const logoutResponse = await agent
      .post('/api/auth/logout')
      .set('x-csrf-token', rotatedToken || '')
      .send();
    expect(logoutResponse.status).toBe(200);
  });
});
