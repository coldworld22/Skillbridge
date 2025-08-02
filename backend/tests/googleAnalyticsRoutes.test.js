const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/thirdPartyConfig/thirdPartyConfig.service', () => ({
  getSettings: jest.fn(),
}));

const service = require('../src/modules/thirdPartyConfig/thirdPartyConfig.service');
const routes = require('../src/modules/googleAnalytics/googleAnalytics.routes');

const app = express();
app.use('/api/google-analytics', routes);

describe('GET /api/google-analytics', () => {
  it('returns analytics config', async () => {
    const cfg = { measurementId: 'G-TEST', enabled: true };
    service.getSettings.mockResolvedValue({ googleAnalytics: cfg });

    const res = await request(app).get('/api/google-analytics');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(cfg);
    expect(service.getSettings).toHaveBeenCalled();
  });

  it('returns empty when inactive', async () => {
    const cfg = { measurementId: 'G-TEST', enabled: true, active: false };
    service.getSettings.mockResolvedValue({ googleAnalytics: cfg });

    const res = await request(app).get('/api/google-analytics');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
