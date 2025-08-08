const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  sendVerificationOtp: jest.fn(),
  confirmVerificationOtp: jest.fn(),
}));

const service = require('../src/modules/auth/services/auth.service');
const routes = require('../src/modules/auth/routes/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/auth', routes);

const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/auth/send-verification', () => {
  it('triggers sendVerificationOtp service', async () => {
    service.sendVerificationOtp.mockResolvedValue();
    const res = await request(app)
      .post('/api/auth/send-verification')
      .send({ user_id: 1, type: 'email' });
    expect(res.status).toBe(200);
    expect(service.sendVerificationOtp).toHaveBeenCalledWith({ user_id: 1, type: 'email' });
    expect(res.body.message).toMatch(/sent/i);
  });
});

describe('POST /api/auth/confirm-verification', () => {
  it('confirms verification OTP', async () => {
    service.confirmVerificationOtp.mockResolvedValue();
    const res = await request(app)
      .post('/api/auth/confirm-verification')
      .send({ user_id: 1, type: 'email', code: '123456' });
    expect(res.status).toBe(200);
    expect(service.confirmVerificationOtp).toHaveBeenCalledWith({ user_id: 1, type: 'email', code: '123456' });
    expect(res.body.message).toMatch(/successful/i);
  });

  it('returns error for invalid OTP', async () => {
    const AppError = require('../src/utils/AppError');
    service.confirmVerificationOtp.mockRejectedValue(new AppError('Invalid or expired OTP', 400));
    const res = await request(app)
      .post('/api/auth/confirm-verification')
      .send({ user_id: 1, type: 'email', code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });
});
