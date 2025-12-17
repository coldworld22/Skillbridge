const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/policies/policies.service', () => ({
  getPolicies: jest.fn(),
  updatePolicies: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/policies/policies.service');
const routes = require('../src/modules/policies/policies.routes');

const app = express();
app.use(express.json());
app.use('/api/policies', routes);

describe('GET /api/policies', () => {
  it('returns policies', async () => {
    const mock = { test: { title: 'T' } };
    service.getPolicies.mockResolvedValue(mock);

    const res = await request(app).get('/api/policies');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getPolicies).toHaveBeenCalled();
  });
});

describe('PUT /api/policies', () => {
  it('updates policies', async () => {
    const payload = { test: { title: 'New' } };
    service.updatePolicies.mockResolvedValue(payload);

    const res = await request(app).put('/api/policies').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updatePolicies).toHaveBeenCalledWith(payload);
  });
});
