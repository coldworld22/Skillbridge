const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/community/admin/admin.service', () => ({
  getAllDiscussions: jest.fn(),
  getDashboardData: jest.fn(),
}));


jest.mock('../src/modules/community/admin/tags.service', () => ({
  getAllTags: jest.fn(),
}));

jest.mock('../src/modules/community/admin/announcements.service', () => ({
  getAllAnnouncements: jest.fn(),
}));

jest.mock('../src/modules/community/admin/reports.service', () => ({
  getAllReports: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../src/modules/community/admin/contributors.service', () => ({
  getTopContributors: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/community/admin/admin.service');

const tagService = require('../src/modules/community/admin/tags.service');
const annService = require('../src/modules/community/admin/announcements.service');
const contributorsService = require('../src/modules/community/admin/contributors.service');

const routes = require('../src/modules/community/admin/admin.routes');

const app = express();
app.use(express.json());
app.use('/api/community/admin', routes);

describe('GET /api/community/admin/discussions', () => {
  it('returns list of discussions', async () => {
    const mock = [{ id: '1' }];
    service.getAllDiscussions.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/discussions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAllDiscussions).toHaveBeenCalled();
  });
});


describe('GET /api/community/admin/tags', () => {
  it('returns tags', async () => {
    const mock = [{ id: 1 }];
    tagService.getAllTags.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/tags');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(tagService.getAllTags).toHaveBeenCalled();
  });
});

describe('GET /api/community/admin/announcements', () => {
  it('returns announcements', async () => {
    const mock = [{ id: 'a1' }];
    annService.getAllAnnouncements.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/announcements');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(annService.getAllAnnouncements).toHaveBeenCalled();
  });
});

describe('GET /api/community/admin/stats', () => {
  it('returns dashboard stats', async () => {
    const mock = { totalDiscussions: 5 };
    service.getDashboardData.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getDashboardData).toHaveBeenCalled();
  });
});

describe('GET /api/community/admin/contributors', () => {
  it('returns contributors', async () => {
    const mock = [{ name: 'Jane' }];
    contributorsService.getTopContributors.mockResolvedValue(mock);

    const res = await request(app).get('/api/community/admin/contributors');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(contributorsService.getTopContributors).toHaveBeenCalled();
  });
});

