const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/library/library.service', () => ({
  listForStudent: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: '1' };
    next();
  },
  isStudent: (_req, _res, next) => next(),
}));

const service = require('../src/modules/library/library.service');
const routes = require('../src/modules/library/library.routes');

const app = express();
app.use(express.json());
app.use('/api/library', routes);

describe('GET /api/library', () => {
  it('returns purchased books', async () => {
    const items = [{ id: '1', title: 'Book' }];
    service.listForStudent.mockResolvedValue(items);
    const res = await request(app).get('/api/library');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(items);
    expect(service.listForStudent).toHaveBeenCalled();
  });
});
