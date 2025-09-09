const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  generateOtp: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findByEmail: jest.fn(),
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
const userModel = require('../src/modules/users/user.model');
const routes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use(routes);

const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);
describe('POST /api/auth/forgot-password', () => {
  it('invokes generateOtp and returns message', async () => {
    service.generateOtp.mockResolvedValue();
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(service.generateOtp).toHaveBeenCalledWith('test@example.com', undefined);
    expect(res.body.message).toBeDefined();
  });

  it('passes via sms when requested', async () => {
    service.generateOtp.mockResolvedValue();
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com', phone: '+11234567890', is_phone_verified: true });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com', via: 'sms' });
    expect(res.status).toBe(200);
    expect(service.generateOtp).toHaveBeenCalledWith('test@example.com', 'sms');
  });

  it('returns generic message for unknown email', async () => {
    service.generateOtp.mockResolvedValue();
    userModel.findByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email exists/i);
  });
});
