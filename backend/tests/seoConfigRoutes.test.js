const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/seoConfig/seoConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
  generateSitemap: jest.fn(),
  scanMetaIssues: jest.fn(),
  listPages: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'admin1' }]),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'admin1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant-1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/seoConfig/seoConfig.service');
const routes = require('../src/modules/seoConfig/seoConfig.routes');

const app = express();
app.use(express.json());
app.use('/api/seo-config', routes);

describe('GET /api/seo-config', () => {
  it('returns settings', async () => {
    const mock = { globalSEO: {} };
    service.getSettings.mockResolvedValue(mock);

    const res = await request(app).get('/api/seo-config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getSettings).toHaveBeenCalled();
  });
});

describe('PUT /api/seo-config', () => {
  it('updates settings', async () => {
    const payload = { globalSEO: { forceCanonical: true } };
    service.updateSettings.mockResolvedValue(payload);

    const res = await request(app).put('/api/seo-config').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(service.updateSettings).toHaveBeenCalledWith(payload);
  });
});

describe('POST /api/seo-config/sitemap/regenerate', () => {
  it('regenerates sitemap', async () => {
    const result = { url: '/uploads/seo/sitemap.xml', updated: 'now' };
    service.generateSitemap.mockResolvedValue(result);

    const res = await request(app).post('/api/seo-config/sitemap/regenerate');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(result);
    expect(service.generateSitemap).toHaveBeenCalled();
  });
});

describe('GET /api/seo-config/meta-scan', () => {
  it('scans meta tags', async () => {
    const scan = { stats: { indexedPages: 1 }, issues: [], scannedAt: '2025-07-28T11:00:00Z' };
    service.scanMetaIssues.mockResolvedValue(scan);

    const res = await request(app).get('/api/seo-config/meta-scan');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(scan);
    expect(service.scanMetaIssues).toHaveBeenCalled();
  });
});

describe('GET /api/seo-config/pages', () => {
  it('lists available pages', async () => {
    const pages = ['/', '/about'];
    service.listPages.mockResolvedValue(pages);

    const res = await request(app).get('/api/seo-config/pages');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(pages);
    expect(service.listPages).toHaveBeenCalled();
  });
});
