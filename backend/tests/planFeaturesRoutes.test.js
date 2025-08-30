const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanFeatures: jest.fn(),
}));

const service = require('../src/modules/plans/plans.service');
const routes = require('../src/modules/plans/plans.routes');

const app = express();
app.use('/api/plans', routes);

describe('GET /api/plans/features', () => {
  it('returns plan features', async () => {
    const mock = { basic: { maxAds: 1 } };
    service.getPlanFeatures.mockResolvedValue(mock);
    const res = await request(app).get('/api/plans/features');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });

  it('forwards prefix query param to service', async () => {
    service.getPlanFeatures.mockResolvedValue({});
    await request(app).get('/api/plans/features?prefix=ads');
    expect(service.getPlanFeatures).toHaveBeenCalledWith('ads');
  });
});
