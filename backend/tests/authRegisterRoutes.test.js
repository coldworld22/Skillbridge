const request = require('supertest');
const express = require('express');

process.env.NODE_ENV = 'production';

jest.mock('../src/config/database', () => ({
  raw: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/modules/auth/services/auth.service', () => ({
  registerUser: jest.fn(),
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

const authService = require('../src/modules/auth/services/auth.service');
const routes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(routes);
app.use(errorHandler);

describe('POST /api/auth/register', () => {
  const payload = {
    full_name: 'Test User',
    email: 'test@example.com',
    phone: '+11234567890',
    password: 'StrongPass1!'
  };

  it('registers a user successfully', async () => {
    authService.registerUser.mockResolvedValue({ user: { id: 1 } });
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(authService.registerUser).toHaveBeenCalledWith(payload);
    expect(res.body.message).toMatch(/successful/i);
  });

  it('handles duplicate email', async () => {
    authService.registerUser.mockRejectedValue({ code: '23505', detail: 'users_email_unique' });
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email is already registered/i);
  });

  it('handles duplicate phone', async () => {
    authService.registerUser.mockRejectedValue({ code: '23505', detail: 'users_phone_unique' });
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/phone number is already registered/i);
  });
});
