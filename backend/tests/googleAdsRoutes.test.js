const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/thirdPartyConfig/thirdPartyConfig.service', () => ({
  getSettings: jest.fn(),
}));

const service = require('../src/modules/thirdPartyConfig/thirdPartyConfig.service');
const routes = require('../src/modules/googleAds/googleAds.routes');

const app = express();
app.use('/api/google-ads', routes);

describe('GET /api/google-ads', () => {
  it('returns google ads config', async () => {
    const cfg = {
      conversionId: 'AW-123456789',
      conversions: [{ event: 'signup', sendTo: 'AW-123456789/abc123' }],
    };
    service.getSettings.mockResolvedValue({ googleAds: cfg });

    const res = await request(app).get('/api/google-ads');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(cfg);
    expect(service.getSettings).toHaveBeenCalled();
  });

  it('returns empty when inactive', async () => {
    const cfg = {
      conversionId: 'AW-123456789',
      conversions: [],
      active: false,
    };
    service.getSettings.mockResolvedValue({ googleAds: cfg });

    const res = await request(app).get('/api/google-ads');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
