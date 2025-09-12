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

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=r', 'csrfToken=t'])
      .set('x-csrf-token', 't');

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBe('newA');
    expect(authService.rotateRefreshToken).toHaveBeenCalledWith('r');
    expect(refreshRes.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('csrfToken='),
      ])
    );
  });
});
