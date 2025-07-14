const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/auth/services/auth.service', () => ({
  generateOtp: jest.fn(),
}));

const service = require('../src/modules/auth/services/auth.service');
const routes = require('../src/modules/auth/routes/auth.routes');

const app = express();
app.use(express.json());
app.use('/api/auth', routes);

describe('POST /api/auth/forgot-password', () => {
  it('invokes generateOtp and returns message', async () => {
    service.generateOtp.mockResolvedValue();
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(service.generateOtp).toHaveBeenCalledWith('test@example.com');
    expect(res.body.message).toBeDefined();
  });
});

