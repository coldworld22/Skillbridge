const request = require('supertest');
const express = require('express');

jest.mock('child_process', () => ({
  execFile: jest.fn((_script, _opts, cb) =>
    cb(null, '{"node":true,"docker":true,"dockerCompose":true,"git":true}\n', '')
  ),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 1, roles: ['admin'], role: 'admin' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

const { execFile } = require('child_process');
const { router } = require('../src/modules/install/install.routes');

const app = express();
app.use(express.json());
app.use('/api/install', router);

afterEach(() => {
  delete process.env.INSTALL_API_ENABLED;
  jest.clearAllMocks();
});

describe('/api/install/prereqs', () => {
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
    expect(res.body).toEqual({
      node: true,
      docker: true,
      dockerCompose: true,
      git: true,
    });
    expect(execFile).toHaveBeenCalled();
  });
});

describe('/api/install/run', () => {
  it('passes sanitized credentials to the install script via environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';

    const res = await request(app)
      .post('/api/install/run')
      .send({
        adminEmail: '  admin@example.com  \n',
        adminPassword: '  pass\nword  ',
      });

    expect(res.status).toBe(200);

    expect(execFile).toHaveBeenCalledTimes(1);
    const execOptions = execFile.mock.calls[0][1];
    expect(execOptions.shell).toBe(false);
    expect(execOptions.env).toEqual(
      expect.objectContaining({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'password',
      })
    );

    if (process.env.PATH) {
      expect(execOptions.env.PATH).toBe(process.env.PATH);
    }

    expect(res.body).toEqual({
      node: true,
      docker: true,
      dockerCompose: true,
      git: true,
    });
  });
});
