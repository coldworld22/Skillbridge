const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/thirdPartyConfig/thirdPartyConfig.service', () => ({
  getSettings: jest.fn(),
}));

const service = require('../src/modules/thirdPartyConfig/thirdPartyConfig.service');
const routes = require('../src/modules/adsense/adsense.routes');

const app = express();
app.use('/api/adsense', routes);

describe('GET /api/adsense', () => {
  it('returns adsense config', async () => {
    const cfg = { clientID: 'pub', slotID: '123', enabled: true };
    service.getSettings.mockResolvedValue({ googleAdSense: cfg });

    const res = await request(app).get('/api/adsense');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(cfg);
    expect(service.getSettings).toHaveBeenCalled();
  });

  it('returns empty when inactive', async () => {
    const cfg = { clientID: 'pub', slotID: '123', enabled: true, active: false };
    service.getSettings.mockResolvedValue({ googleAdSense: cfg });

    const res = await request(app).get('/api/adsense');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
