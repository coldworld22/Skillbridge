const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/users/categories/category.service', () => ({
  getAll: jest.fn(),
  getNested: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findBySlug: jest.fn(),
  countChildren: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/users/categories/category.service');
const routes = require('../src/modules/users/categories/category.routes');

const app = express();
app.use(express.json());
app.use('/api/categories', routes);

describe('GET /api/categories', () => {
  it('returns categories list', async () => {
    const mock = { total: 1, data: [{ id: '1', name: 'Test' }], page: 1, limit: 10 };
    service.getAll.mockResolvedValue(mock);
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getAll).toHaveBeenCalled();
  });
});

describe('GET /api/categories/tree', () => {
  it('returns nested categories', async () => {
    const tree = [{ id: '1', name: 'Root', children: [] }];
    service.getNested.mockResolvedValue(tree);
    const res = await request(app).get('/api/categories/tree');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(tree);
    expect(service.getNested).toHaveBeenCalled();
  });
});

describe('POST /api/categories/create', () => {
  it('creates a category', async () => {
    const payload = { name: 'New', status: 'active' };
    service.exists.mockResolvedValue(null);
    service.findBySlug.mockResolvedValue(null);
    service.create.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/categories/create').send(payload);
    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalled();
  });
});

describe('PATCH /api/categories/:id/status', () => {
  it('updates category status', async () => {
    service.findById.mockResolvedValue({ id: '1' });
    service.updateStatus.mockResolvedValue(1);
    const res = await request(app).patch('/api/categories/1/status').send({ status: 'inactive' });
    expect(res.status).toBe(200);
    expect(service.updateStatus).toHaveBeenCalledWith('1', 'inactive');
  });
});

describe('DELETE /api/categories/:id', () => {
  it('returns 400 when category has children', async () => {
    service.findById.mockResolvedValue({ id: '1', image_url: null });
    service.countChildren.mockResolvedValue(2);
    const res = await request(app).delete('/api/categories/1');
    expect(res.status).toBe(400);
    expect(service.countChildren).toHaveBeenCalledWith('1');
  });

  it('deletes category without children', async () => {
    service.findById.mockResolvedValue({ id: '1', image_url: null });
    service.countChildren.mockResolvedValue(0);
    service.delete.mockResolvedValue(1);
    const res = await request(app).delete('/api/categories/1');
    expect(res.status).toBe(200);
    expect(service.delete).toHaveBeenCalledWith('1');
  });
});

