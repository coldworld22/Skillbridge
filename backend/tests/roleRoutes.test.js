const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/roles/roles.service', () => ({
  getRoles: jest.fn(),
  getPermissions: jest.fn(),
  assignPermissions: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (_req, _res, next) => next(),
  isAdmin: (_req, _res, next) => next(),
}));

const service = require('../src/modules/roles/roles.service');
const routes = require('../src/modules/roles/roles.routes');

const app = express();
app.use(express.json());
app.use('/api/roles', routes);

describe('GET /api/roles', () => {
  it('returns roles', async () => {
    const mock = [{ id: 1, name: 'Admin' }];
    service.getRoles.mockResolvedValue(mock);

    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getRoles).toHaveBeenCalled();
  });
});

describe('GET /api/roles/permissions', () => {
  it('returns permissions', async () => {
    const mock = [{ id: 1 }];
    service.getPermissions.mockResolvedValue(mock);

    const res = await request(app).get('/api/roles/permissions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getPermissions).toHaveBeenCalled();
  });
});

describe('POST /api/roles/:id/permissions', () => {
  it('assigns permissions', async () => {
    const mock = { id: 1, permissions: [] };
    service.assignPermissions.mockResolvedValue(mock);

    const res = await request(app)
      .post('/api/roles/1/permissions')
      .send({ permissionIds: [1, 2] });
    expect(res.status).toBe(200);
    expect(service.assignPermissions).toHaveBeenCalled();
  });
});
