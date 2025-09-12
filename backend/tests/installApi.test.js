const request = require('supertest');
const express = require('express');

jest.mock('child_process', () => ({
  execFile: jest.fn((_script, _opts, cb) => cb(null, 'ok', '')),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 1, roles: ['admin'], role: 'admin' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

const { execFile } = require('child_process');
const routes = require('../src/modules/install/install.routes');

const app = express();
app.use('/api/install', routes);

describe('/api/install/prereqs', () => {
  afterEach(() => {
    delete process.env.INSTALL_API_ENABLED;
    jest.clearAllMocks();
  });

  it('returns 403 when INSTALL_API_ENABLED is false', async () => {
    process.env.INSTALL_API_ENABLED = 'false';
    const res = await request(app).get('/api/install/prereqs');
    expect(res.status).toBe(403);
    expect(execFile).not.toHaveBeenCalled();
  });

  it('returns 200 for admin when flag is true', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    const res = await request(app).get('/api/install/prereqs');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(execFile).toHaveBeenCalled();
  });
});
