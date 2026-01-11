const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/blog/blog.service', () => ({
  createPost: jest.fn(),
  getPosts: jest.fn(),
  getPostById: jest.fn(),
  findBySlug: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/tenant', () => ({
  resolveTenant: (req, _res, next) => { req.tenant = { id: 'tenant-1' }; next(); },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock('../src/middleware/storage', () => ({
  checkAndConsumeStorage: () => (_req, _res, next) => next(),
}));

jest.mock('../src/modules/blog/blogUploadMiddleware', () => ({
  single: () => (_req, _res, next) => next(),
}));

const service = require('../src/modules/blog/blog.service');
const routes = require('../src/modules/blog/blog.routes');

const app = express();
app.use(express.json());
app.use('/api/blog', routes);

beforeEach(() => {
  jest.clearAllMocks();
  service.findBySlug.mockResolvedValue(null);
});

describe('GET /api/blog', () => {
  it('returns posts', async () => {
    const mock = [{ id: '1' }];
    service.getPosts.mockResolvedValue(mock);
    const res = await request(app).get('/api/blog');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
  });
});

describe('GET /api/blog/slug/:slug', () => {
  it('returns post by slug', async () => {
    const mock = { id: '1', slug: 'test' };
    service.findBySlug.mockResolvedValue(mock);
    const res = await request(app).get('/api/blog/slug/test');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.findBySlug).toHaveBeenCalledWith('test');
  });
});

describe('POST /api/blog', () => {
  it('creates post', async () => {
    const payload = { title: 'Test' };
    service.createPost.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/blog').send(payload);
    expect(res.status).toBe(200);
    expect(service.createPost).toHaveBeenCalled();
  });
});

describe('PUT /api/blog/:id', () => {
  it('updates post', async () => {
    const payload = { title: 'Up' };
    service.getPostById.mockResolvedValue({ id: '1', title: 'Old' });
    service.updatePost.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).put('/api/blog/1').send(payload);
    expect(res.status).toBe(200);
    expect(service.updatePost).toHaveBeenCalledWith('1', expect.any(Object));
  });
});

describe('DELETE /api/blog/:id', () => {
  it('deletes post', async () => {
    service.deletePost.mockResolvedValue(1);
    const res = await request(app).delete('/api/blog/1');
    expect(res.status).toBe(200);
    expect(service.deletePost).toHaveBeenCalledWith('1');
  });
});
