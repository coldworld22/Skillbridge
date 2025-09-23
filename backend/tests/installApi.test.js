const express = require('express');
const request = require('supertest');

jest.mock('child_process', () => {
  const util = require('util');

  const mockExecFile = jest.fn((script, args, options, callback) => {
    if (typeof args === 'function') {
      callback = args;
      args = [];
      options = {};
    } else if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (typeof callback !== 'function') {
      throw new Error('execFile mock missing callback');
    }
    const output = JSON.stringify({ ok: true, allPassed: true });
    callback(null, `${output}\n`, '');
  });

  mockExecFile[util.promisify.custom] = (script, args, options) =>
    new Promise((resolve, reject) => {
      mockExecFile(script, args, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });

  return { execFile: mockExecFile };
});

const mockHasExistingAdmin = jest.fn();
const mockRefreshAdminPresence = jest.fn();
const mockMarkAdminExists = jest.fn();

jest.mock('../src/modules/install/install.helpers', () => ({
  hasExistingAdmin: (...args) => mockHasExistingAdmin(...args),
  refreshAdminPresence: (...args) => mockRefreshAdminPresence(...args),
  markAdminExists: (...args) => mockMarkAdminExists(...args),
}));

const mockGetAppSettings = jest.fn();
const mockUpdateAppSettings = jest.fn();
const mockGetEmailSettings = jest.fn();
const mockUpdateEmailSettings = jest.fn();

jest.mock('../src/modules/appConfig/appConfig.service', () => ({
  getSettings: (...args) => mockGetAppSettings(...args),
  updateSettings: (...args) => mockUpdateAppSettings(...args),
}));

jest.mock('../src/modules/emailConfig/emailConfig.service', () => ({
  getSettings: (...args) => mockGetEmailSettings(...args),
  updateSettings: (...args) => mockUpdateEmailSettings(...args),
}));

const { execFile } = require('child_process');
const { router } = require('../src/modules/install/install.routes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/install', router);

const buildPayload = () => ({
  adminEmail: 'admin@example.com',
  adminPassword: 'password123',
  appName: 'SkillBridge',
  supportEmail: 'support@example.com',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: 'mailer',
  smtpPassword: 'smtp-secret',
  smtpSecure: 'true',
  smtpFromEmail: 'notifications@example.com',
  smtpFromName: 'SkillBridge',
  logoUrl: 'https://cdn.example.com/logo.png',
});

beforeEach(() => {
  process.env.INSTALL_API_ENABLED = 'true';
  delete process.env.ENABLE_INSTALL;
  delete process.env.INSTALL_SETUP_SECRET;
  mockHasExistingAdmin.mockResolvedValue(false);
  mockRefreshAdminPresence.mockResolvedValue(false);
  mockMarkAdminExists.mockClear();
  mockGetAppSettings.mockResolvedValue({});
  mockUpdateAppSettings.mockResolvedValue({});
  mockGetEmailSettings.mockResolvedValue({});
  mockUpdateEmailSettings.mockResolvedValue({});
  execFile.mockClear();
});

afterEach(() => {
  delete process.env.INSTALL_API_ENABLED;
  delete process.env.ENABLE_INSTALL;
  delete process.env.INSTALL_SETUP_SECRET;
});

describe('GET /api/install/prereqs', () => {
  it('returns 403 when installer API is disabled', async () => {
    process.env.INSTALL_API_ENABLED = 'false';
    const res = await request(app).get('/api/install/prereqs');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Installer API disabled' });
    expect(execFile).not.toHaveBeenCalled();
  });

  it('executes the prerequisite script and returns its JSON output', async () => {
    mockHasExistingAdmin.mockResolvedValue(false);
    const res = await request(app).get('/api/install/prereqs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, allPassed: true });
    expect(execFile).toHaveBeenCalledTimes(1);
  });

  it('requires a setup secret when an admin already exists', async () => {
    process.env.INSTALL_SETUP_SECRET = 'super-secret';
    mockHasExistingAdmin.mockResolvedValue(true);

    const res = await request(app).get('/api/install/prereqs');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 'INSTALL_LOCKED',
      message: 'Installer locked. Provide a valid setup secret.',
    });
    expect(execFile).not.toHaveBeenCalled();
  });

  it('accepts the setup secret header when provided', async () => {
    process.env.INSTALL_SETUP_SECRET = 'super-secret';
    mockHasExistingAdmin.mockResolvedValue(true);

    const res = await request(app)
      .get('/api/install/prereqs')
      .set('x-install-setup-secret', 'super-secret');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, allPassed: true });
  });
});

describe('POST /api/install/run', () => {
  const postInstall = (payload, headers = {}) => {
    const req = request(app).post('/api/install/run');
    Object.entries(headers).forEach(([key, value]) => {
      req.set(key, value);
    });
    Object.entries(payload).forEach(([key, value]) => {
      req.field(key, value);
    });
    return req;
  };

  it('validates required configuration fields', async () => {
    const res = await request(app)
      .post('/api/install/run')
      .field('adminEmail', 'user@example.com')
      .field('adminPassword', 'short');

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ message: 'Validation error' }));
    expect(execFile).not.toHaveBeenCalled();
  });

  it('requires the setup secret when configured', async () => {
    process.env.INSTALL_SETUP_SECRET = 'top-secret';
    const payload = buildPayload();
    const res = await postInstall(payload);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 'INSTALL_LOCKED',
      message: 'Installer locked. Provide a valid setup secret.',
    });
    expect(execFile).not.toHaveBeenCalled();
  });

  it('runs the installer script and updates configuration', async () => {
    const payload = buildPayload();
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await postInstall(payload);

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);
    const installCall = execFile.mock.calls[0];
    expect(installCall[0]).toContain('install.sh');
    const env = installCall[2]?.env;
    expect(env).toEqual(expect.objectContaining({
      ADMIN_EMAIL: payload.adminEmail,
      ADMIN_PASSWORD: payload.adminPassword,
      INSTALL_CONFIG_PATH: expect.any(String),
    }));
    expect(mockUpdateAppSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: payload.appName,
        supportEmail: payload.supportEmail,
        contactEmail: payload.supportEmail,
        logo_url: payload.logoUrl,
      })
    );
    expect(mockUpdateEmailSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        username: payload.smtpUsername,
        password: payload.smtpPassword,
        fromEmail: payload.smtpFromEmail,
        fromName: payload.smtpFromName,
      })
    );
  });

  it('propagates installer failures', async () => {
    execFile.mockImplementationOnce((script, args, options, callback) => {
      const error = new Error('install failed');
      error.stdout = JSON.stringify({ ok: false, message: 'Install failed' });
      error.stderr = '';
      callback(error);
    });

    const res = await postInstall(buildPayload());
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, message: 'Install failed' });
  });

  it('allows running the installer when only POSTGRES_* variables are provided', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.PRODUCTION_DATABASE_URL;
    delete process.env.DATABASE_USER;
    delete process.env.DATABASE_PASSWORD;

    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = '5432';
    process.env.POSTGRES_USER = 'postgres-user';
    process.env.POSTGRES_PASSWORD = 'postgres-password';
    process.env.POSTGRES_DB = 'skillbridge';

    const res = await postInstall(buildPayload());

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);

    const installCall = execFile.mock.calls[0];
    const env = installCall[2]?.env ?? {};
    expect(env.POSTGRES_USER).toBe('postgres-user');
    expect(env.POSTGRES_PASSWORD).toBe('postgres-password');
    expect(env.POSTGRES_DB).toBe('skillbridge');

    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_DB;
  });
});
