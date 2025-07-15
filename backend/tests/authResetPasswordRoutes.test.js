const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  resetPassword: jest.fn(),
}));

const service = require('../src/modules/auth/services/auth.service');
const routes = require('../src/modules/auth/routes/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/auth', routes);

const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/auth/reset-password', () => {
  it('resets password and returns success', async () => {
    service.resetPassword.mockResolvedValue();
    const payload = { email: 'test@example.com', code: '123456', new_password: 'NewPass1!' };
    const res = await request(app).post('/api/auth/reset-password').send(payload);
    expect(res.status).toBe(200);
    expect(service.resetPassword).toHaveBeenCalledWith(payload);
    expect(res.body.message).toMatch(/successful/i);
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
