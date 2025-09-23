const request = require('supertest');
const express = require('express');

jest.mock('child_process', () => ({
  execFile: jest.fn((_script, _opts, cb) =>
    cb(null, '{"node":true,"docker":true,"dockerCompose":true,"git":true}\n', '')
  ),
}));

const mockVerifyToken = jest.fn();
const mockIsAdmin = jest.fn();

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, res, next) => mockVerifyToken(req, res, next),
  isAdmin: (req, res, next) => mockIsAdmin(req, res, next),
}));

const mockFindAdmins = jest.fn();

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: (...args) => mockFindAdmins(...args),
}));

const mockRefreshAdminPresence = jest.fn().mockResolvedValue(false);
const mockMarkAdminExists = jest.fn();

jest.mock('../src/modules/install/install.helpers', () => ({
  refreshAdminPresence: (...args) => mockRefreshAdminPresence(...args),
  markAdminExists: (...args) => mockMarkAdminExists(...args),
}));

const ensureEnv = (key, fallback) => {
  if (!process.env[key]) {
    process.env[key] = fallback;
  }
};

ensureEnv('JWT_SECRET', 'test-jwt-secret');
ensureEnv('REFRESH_TOKEN_SECRET', 'test-refresh-secret');
ensureEnv('SESSION_SECRET', 'test-session-secret');
ensureEnv('TEST_DATABASE_URL', 'postgres://user:pass@localhost:5432/testdb');

const { execFile } = require('child_process');
const { router } = require('../src/modules/install/install.routes');
const controller = require('../src/modules/install/install.controller');

const app = express();
app.use(express.json());
app.use('/api/install', router);

afterEach(() => {
  delete process.env.INSTALL_API_ENABLED;
  delete process.env.INSTALL_SETUP_SECRET;
  jest.clearAllMocks();
});

describe('/api/install/prereqs', () => {
  it('returns 403 when INSTALL_API_ENABLED is false', async () => {
    process.env.INSTALL_API_ENABLED = 'false';
    mockFindAdmins.mockResolvedValue([]);

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(403);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('returns 200 for admin when flag is true', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockFindAdmins.mockResolvedValue([{ id: 1 }]);
    mockVerifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 1, roles: ['admin'], role: 'admin' };
      next();
    });
    mockIsAdmin.mockImplementation((_req, _res, next) => next());

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      node: true,
      docker: true,
      dockerCompose: true,
      git: true,
    });
    expect(execFile).toHaveBeenCalled();
    expect(mockVerifyToken).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).toHaveBeenCalledTimes(1);
  });

  it('allows access with setup secret when no admins exist', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockFindAdmins.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/install/prereqs')
      .set('x-install-setup-secret', 's3cret');

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('requires authentication once an admin exists', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockFindAdmins.mockResolvedValue([{ id: 1 }]);
    mockVerifyToken.mockImplementation((req, res) =>
      res.status(401).json({ message: 'Missing or malformed token' })
    );

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(401);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('requires authentication when a setup secret is configured', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockFindAdmins.mockResolvedValue([]);
    mockVerifyToken.mockImplementation((req, res) =>
      res.status(401).json({ message: 'Missing or malformed token' })
    );

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(401);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });
});

describe('/api/install/run', () => {
  it('passes credentials to the installer environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
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
        .set('x-install-setup-secret', 's3cret')
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

describe('/api/install/run', () => {
  it('rejects POST attempts without the setup secret when configured', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockFindAdmins.mockResolvedValue([]);
    mockVerifyToken.mockImplementation((req, res) =>
      res.status(401).json({ message: 'Missing or malformed token' })
    );

    const res = await request(app)
      .post('/api/install/run')
      .send({ adminEmail: 'admin@example.com', adminPassword: 'password123' });

    expect(res.status).toBe(401);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('allows POST attempts when the correct setup secret is provided', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockFindAdmins.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 's3cret')
      .send({ adminEmail: 'admin@example.com', adminPassword: 'password123' });

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('passes sanitized credentials to the install script via environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 's3cret')
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
