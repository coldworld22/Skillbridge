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

const { execFile } = require('child_process');
const { router } = require('../src/modules/install/install.routes');

const app = express();
app.use('/api/install', router);

describe('/api/install/prereqs', () => {
  beforeEach(() => {
    mockVerifyToken.mockReset();
    mockIsAdmin.mockReset();
    mockFindAdmins.mockReset();
    execFile.mockClear();
    delete process.env.INSTALL_API_ENABLED;
    delete process.env.INSTALL_SETUP_SECRET;
  });

  afterEach(() => {
    delete process.env.INSTALL_API_ENABLED;
    delete process.env.INSTALL_SETUP_SECRET;
  });

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

  it('allows unauthenticated access when no admins exist', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockFindAdmins.mockResolvedValue([]);

    const res = await request(app).get('/api/install/prereqs');

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
