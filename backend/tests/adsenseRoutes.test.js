const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/thirdPartyConfig/thirdPartyConfig.service', () => ({
  getSettings: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/thirdPartyConfig/thirdPartyConfig.service');
const routes = require('../src/modules/adsense/adsense.routes');

const app = express();
app.use('/api/adsense', routes);

describe('GET /api/adsense', () => {
  it('returns adsense config', async () => {
    const cfg = {
      publisherId: 'ca-pub-12345',
      adSlots: ['123', '456'],
      autoAds: 'disabled',
    };
    service.getSettings.mockResolvedValue({ googleAdSense: cfg });

    const res = await request(app).get('/api/adsense');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      active: true,
      publisherId: 'ca-pub-12345',
      adSlots: ['123', '456'],
      autoAds: 'disabled',
    });
    expect(service.getSettings).toHaveBeenCalled();
  });

  it('returns empty when inactive', async () => {
    const cfg = { publisherId: 'ca-pub-123', adSlots: ['123'], active: false };
    service.getSettings.mockResolvedValue({ googleAdSense: cfg });

    const res = await request(app).get('/api/adsense');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  it('returns empty when publisher id missing', async () => {
    const cfg = { adSlots: ['123'], active: true };
    service.getSettings.mockResolvedValue({ googleAdSense: cfg });

    const res = await request(app).get('/api/adsense');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
