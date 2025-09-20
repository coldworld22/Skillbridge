const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET = 'test-jwt';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
process.env.SESSION_SECRET = 'test-session';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  resetPassword: jest.fn(),
}));

// Mock unrelated routes used by grouped auth router
jest.mock('../src/modules/users/user.routes', () => require('express').Router());
jest.mock('../src/modules/verify/verify.routes', () => require('express').Router());
jest.mock('../src/modules/license/license.routes', () => require('express').Router());
jest.mock('../src/modules/users/tutorials/certificate/certificatePublic.routes', () => require('express').Router());
jest.mock('../src/modules/users/tutorials/certificate/certificateAdmin.routes', () => require('express').Router());
jest.mock('../src/modules/certificateTemplates/certificateTemplates.routes', () => require('express').Router());
jest.mock('../src/modules/roles/roles.routes', () => require('express').Router());
jest.mock('../src/modules/plans/plans.routes', () => require('express').Router());
jest.mock('../src/modules/subscriptions/subscriptions.routes', () => require('express').Router());

const service = require('../src/modules/auth/services/auth.service');
const routes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use(routes);

const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/auth/reset-password', () => {
  it('resets password and returns success', async () => {
    service.resetPassword.mockResolvedValue({ warnings: [] });
    const payload = { email: 'test@example.com', code: '123456', new_password: 'NewPass1!' };
    const res = await request(app).post('/api/auth/reset-password').send(payload);
    expect(res.status).toBe(200);
    expect(service.resetPassword).toHaveBeenCalledWith(payload);
    expect(res.body.message).toMatch(/successful/i);
    expect(res.body.warnings).toBeUndefined();
  });

  it('returns 200 with warnings when side-effects fail', async () => {
    const warning = {
      type: 'email',
      message: 'Password reset succeeded, but the confirmation email could not be sent.',
    };
    service.resetPassword.mockResolvedValue({ warnings: [warning] });
    const payload = { email: 'test@example.com', code: '123456', new_password: 'NewPass1!' };
    const res = await request(app).post('/api/auth/reset-password').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.warnings).toEqual([warning]);
  });

  it('returns 400 for invalid OTP', async () => {
    const AppError = require('../src/utils/AppError');
    service.resetPassword.mockRejectedValue(new AppError('Invalid or expired OTP', 400));
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com', code: '000000', new_password: 'NewPass1!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });
});
