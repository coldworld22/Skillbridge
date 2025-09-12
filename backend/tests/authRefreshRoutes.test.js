const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

process.env.NODE_ENV = 'production';

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
  it('refreshes token with refresh cookie', async () => {
    authService.rotateRefreshToken.mockResolvedValue({
      decoded: { id: 1, role: 'User' },
      refreshToken: 'newR',
    });
    authService.generateAccessToken.mockReturnValue('newA');
    const tokenRes = await request(app).get('/api/auth/refresh');
    const cookies = tokenRes.headers['set-cookie'];
    const csrfCookie = cookies.find((c) => c.startsWith('csrfToken=')).split(';')[0];
    const sessionCookie = cookies.find((c) => c.startsWith('connect.sid=')).split(';')[0];
    const csrfToken = csrfCookie.split('=')[1];

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=r`, csrfCookie, sessionCookie])
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

    const tokenRes = await request(app).get('/api/auth/refresh');
    const cookies = tokenRes.headers['set-cookie'];
    const csrfCookie = cookies.find((c) => c.startsWith('csrfToken=')).split(';')[0];
    const sessionCookie = cookies.find((c) => c.startsWith('connect.sid=')).split(';')[0];
    const csrfToken = csrfCookie.split('=')[1];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=bad`, csrfCookie, sessionCookie])
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('rejects request without CSRF token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=r']);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/csrf/i);
  });
});
