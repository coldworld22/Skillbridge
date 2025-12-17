const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/bookCategories/bookCategories.service', () => ({
  list: jest.fn(),
  create: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/bookCategories/bookCategories.service');
const routes = require('../src/modules/bookCategories/bookCategories.routes');

const app = express();
app.use(express.json());
app.use('/api/book-categories', routes);

describe('GET /api/book-categories', () => {
  it('returns categories list', async () => {
    const list = [{ id: '1', name: 'Test' }];
    service.list.mockResolvedValue(list);
    const res = await request(app).get('/api/book-categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(list);
    expect(service.list).toHaveBeenCalled();
  });
});

describe('POST /api/book-categories', () => {
  it('creates a category', async () => {
    const payload = { name: 'New' };
    service.create.mockResolvedValue({ id: '1', ...payload });
    const res = await request(app).post('/api/book-categories').send(payload);
    expect(res.status).toBe(200);
    expect(service.create).toHaveBeenCalled();
  });
});

describe('PUT /api/book-categories/:id', () => {
  it('updates a category', async () => {
    service.getById.mockResolvedValue({ id: '1', name: 'Old' });
    service.update.mockResolvedValue({ id: '1', name: 'Updated' });
    const res = await request(app).put('/api/book-categories/1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(service.update).toHaveBeenCalled();
  });
});

describe('DELETE /api/book-categories/:id', () => {
  it('deletes a category', async () => {
    service.remove.mockResolvedValue(1);
    const res = await request(app).delete('/api/book-categories/1');
    expect(res.status).toBe(200);
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
