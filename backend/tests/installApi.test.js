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
const controller = require('../src/modules/install/install.controller');

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
  it('passes credentials to the installer environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    const adminEmail = 'admin@example.com';
    const adminPassword = 'super-secret';
    const envKey = 'INSTALLER_EXISTING_ENV';
    const originalEnvValue = process.env[envKey];
    process.env[envKey] = 'keep-me';

    execFile.mockImplementationOnce((_script, options, cb) => {
      expect(options).toEqual(
        expect.objectContaining({
          shell: false,
        })
      );
      expect(options.env).toEqual(
        expect.objectContaining({
          ADMIN_EMAIL: adminEmail,
          ADMIN_PASSWORD: adminPassword,
          [envKey]: 'keep-me',
        })
      );
      cb(null, '', '');
    });

    try {
      const res = await request(app)
        .post('/api/install/run')
        .send({ adminEmail, adminPassword });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, output: '' });
      expect(execFile).toHaveBeenCalled();
    } finally {
      if (originalEnvValue === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = originalEnvValue;
      }
    }
  });
});

describe('runInstall controller', () => {
  it('returns a clear error when credentials are missing', () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    controller.runInstall(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: 'Admin email and password are required.',
    });
    expect(execFile).not.toHaveBeenCalled();
  });
});
