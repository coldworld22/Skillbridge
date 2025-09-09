const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  verifyOtp: jest.fn(),
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

describe('POST /api/auth/verify-otp', () => {
  it('returns valid true for correct OTP', async () => {
    service.verifyOtp.mockResolvedValue(true);
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'test@example.com', code: '123456' });
    expect(res.status).toBe(200);
    expect(service.verifyOtp).toHaveBeenCalledWith({ email: 'test@example.com', code: '123456' });
    expect(res.body.valid).toBe(true);
  });

  it('returns error for wrong OTP', async () => {
    const AppError = require('../src/utils/AppError');
    service.verifyOtp.mockRejectedValue(new AppError('Invalid or expired OTP', 400));
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'test@example.com', code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });
});
