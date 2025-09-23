const fs = require('fs');
const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';

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
const mockHasExistingAdmin = jest.fn();
const mockMarkAdminExists = jest.fn();
const mockRefreshAdminPresence = jest.fn();

jest.mock('../src/modules/users/user.model', () => ({
  findAdmins: (...args) => mockFindAdmins(...args),
}));

jest.mock('../src/modules/install/install.helpers', () => ({
  hasExistingAdmin: (...args) => mockHasExistingAdmin(...args),
  markAdminExists: (...args) => mockMarkAdminExists(...args),
  refreshAdminPresence: (...args) => mockRefreshAdminPresence(...args),
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://localhost/testdb';

const { execFile } = require('child_process');
const { router } = require('../src/modules/install/install.routes');
const controller = require('../src/modules/install/install.controller');

const app = express();
app.use(express.json());
app.use('/api/install', router);

const basePayload = {
  adminEmail: 'admin@example.com',
  adminPassword: 'super-secret',
  databaseUrl: 'postgres://user:pass@localhost:5432/skillbridge',
  databaseUser: 'user',
  databasePassword: 'db-password',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'mailer',
  smtpPassword: 'smtp-secret',
  defaultFromEmail: 'notifications@example.com',
  appDisplayName: 'SkillBridge',
  logoUrl: 'https://cdn.example.com/logo.png',
};

const buildPayload = (overrides = {}) => ({ ...basePayload, ...overrides });

afterEach(() => {
  delete process.env.INSTALL_API_ENABLED;
  delete process.env.INSTALL_SETUP_SECRET;
  jest.clearAllMocks();
});

describe('/api/install/prereqs', () => {
  it('returns 403 when INSTALL_API_ENABLED is false', async () => {
    process.env.INSTALL_API_ENABLED = 'false';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(403);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('allows access when no admin exists and no setup secret is configured', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      node: true,
      docker: true,
      dockerCompose: true,
      git: true,
    });
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('returns INSTALL_LOCKED when no credentials are provided', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';
    mockHasExistingAdmin.mockResolvedValue(true);

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: 'Installer locked. Provide a valid setup secret.',
      code: 'INSTALL_LOCKED',
    });
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });
  it('allows access with a valid setup secret', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app)
      .get('/api/install/prereqs')
      .set('x-install-setup-secret', 'setup-secret');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      node: true,
      docker: true,
      dockerCompose: true,
      git: true,
    });
    expect(execFile).toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('returns 200 for admin when flag is true', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockHasExistingAdmin.mockResolvedValue(true);
    mockVerifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 1, roles: ['admin'], role: 'admin' };
      next();
    });
    mockIsAdmin.mockImplementation((_req, _res, next) => next());

    const res = await request(app)
      .get('/api/install/prereqs')
      .set('Authorization', 'Bearer token');

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

  it('returns 403 when a setup secret is configured but missing', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app).get('/api/install/prereqs');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 'INSTALL_LOCKED',
      message: 'Installer locked. Provide a valid setup secret.',
    });
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });
});

describe('/api/install/run', () => {
  it('passes credentials to the installer environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';
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
          ADMIN_EMAIL: basePayload.adminEmail,
          ADMIN_PASSWORD: basePayload.adminPassword,
          DATABASE_URL: basePayload.databaseUrl,
          PRODUCTION_DATABASE_URL: basePayload.databaseUrl,
          DATABASE_USER: basePayload.databaseUser,
          DATABASE_PASSWORD: basePayload.databasePassword,
          SMTP_HOST: basePayload.smtpHost,
          SMTP_PORT: String(basePayload.smtpPort),
          SMTP_USER: basePayload.smtpUser,
          SMTP_PASS: basePayload.smtpPassword,
          DEFAULT_FROM_EMAIL: basePayload.defaultFromEmail,
          SUPPORT_EMAIL: basePayload.defaultFromEmail,
          APP_DISPLAY_NAME: basePayload.appDisplayName,
          INSTALL_LOGO_URL: basePayload.logoUrl,
          SMTP_SECURE: 'false',
          [envKey]: 'keep-me',
        })
      );
      cb(null, '', '');
    });

    try {
      const res = await request(app)
        .post('/api/install/run')
        .set('x-install-setup-secret', 'setup-secret')
        .send(buildPayload());

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

  it('rejects installation when setup secret is missing', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'top-secret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/install/run')
      .send(buildPayload({ adminPassword: 'password123' }));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 'INSTALL_LOCKED',
      message: 'Installer locked. Provide a valid setup secret.',
    });
    expect(execFile).not.toHaveBeenCalled();
  });

  it('rejects installation when setup secret is incorrect', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'top-secret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/install/run')
      .set('X-Install-Setup-Secret', 'wrong-secret')
      .send(buildPayload({ adminPassword: 'password123' }));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 'INSTALL_LOCKED',
      message: 'Installer locked. Provide a valid setup secret.',
    });
    expect(execFile).not.toHaveBeenCalled();
  });

  it('allows installation when setup secret is correct', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'top-secret';
    mockHasExistingAdmin.mockResolvedValue(false);

    execFile.mockImplementationOnce((_script, _options, cb) => cb(null, '', ''));

    const res = await request(app)
      .post('/api/install/run')
      .set('X-Install-Setup-Secret', 'top-secret')
      .send(buildPayload({ adminPassword: 'password123' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, output: '' });
    expect(execFile).toHaveBeenCalledTimes(1);
  });
});

describe('runInstall controller', () => {
  it('returns a clear error when credentials are missing', async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.runInstall(req, res);

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
    mockHasExistingAdmin.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/install/run')
      .send(buildPayload({ adminPassword: 'password123' }));

    expect(res.status).toBe(403);
    expect(execFile).not.toHaveBeenCalled();
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('requires admin authentication when installer is locked without a secret', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    mockHasExistingAdmin.mockResolvedValue(true);
    mockVerifyToken.mockImplementation((req, _res, next) => {
      req.user = { id: 99, role: 'admin', roles: ['admin'] };
      next();
    });
    mockIsAdmin.mockImplementation((_req, _res, next) => next());

    const res = await request(app)
      .post('/api/install/run')
      .set('Authorization', 'Bearer token')
      .send({ adminEmail: 'admin@example.com', adminPassword: 'password123' });

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(mockVerifyToken).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).toHaveBeenCalledTimes(1);
  });

  it('allows POST attempts when the correct setup secret is provided', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 's3cret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 's3cret')
      .send(buildPayload({ adminPassword: 'password123' }));

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);
    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('passes sanitized credentials to the install script via environment', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';
    mockHasExistingAdmin.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 'setup-secret')
      .send({
        ...buildPayload({
          adminEmail: '  admin@example.com  \n',
          adminPassword: '  pass\nword  ',
          databaseUrl: '  postgres://user:pass@localhost:5432/skillbridge  ',
          databaseUser: '  user  ',
          databasePassword: '  db-password  ',
          smtpHost: '  smtp.example.com  ',
          smtpPort: ' 587 ',
          smtpUser: '  mailer  ',
          smtpPassword: '  smtp-secret  ',
          defaultFromEmail: '  notifications@example.com  ',
          appDisplayName: '  SkillBridge  ',
          logoUrl: '  https://cdn.example.com/logo.png  ',
        }),
      });

    expect(res.status).toBe(200);

    expect(execFile).toHaveBeenCalledTimes(1);
    const execOptions = execFile.mock.calls[0][1];
    expect(execOptions.shell).toBe(false);
    expect(execOptions.env).toEqual(
      expect.objectContaining({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'password',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/skillbridge',
        PRODUCTION_DATABASE_URL: 'postgres://user:pass@localhost:5432/skillbridge',
        DATABASE_USER: 'user',
        DATABASE_PASSWORD: 'db-password',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'mailer',
        SMTP_PASS: 'smtp-secret',
        DEFAULT_FROM_EMAIL: 'notifications@example.com',
        SUPPORT_EMAIL: 'notifications@example.com',
        APP_DISPLAY_NAME: 'SkillBridge',
        INSTALL_LOGO_URL: 'https://cdn.example.com/logo.png',
        SMTP_SECURE: 'false',
      })
    );
    expect(execOptions.env.INSTALLER_CONFIG_PATH).toBeUndefined();

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

  it('rejects malformed SMTP configuration', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 'setup-secret')
      .send({
        adminEmail: 'admin@example.com',
        adminPassword: 'password123',
        smtpPort: 'invalid',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation error');
    expect(execFile).not.toHaveBeenCalled();
  });

  it('forwards extended installer configuration via a temporary file', async () => {
    process.env.INSTALL_API_ENABLED = 'true';
    process.env.INSTALL_SETUP_SECRET = 'setup-secret';

    let capturedConfigPath;
    execFile.mockImplementationOnce((_script, options, cb) => {
      capturedConfigPath = options.env.INSTALLER_CONFIG_PATH;
      expect(capturedConfigPath).toBeTruthy();
      expect(fs.existsSync(capturedConfigPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(capturedConfigPath, 'utf8'));
      expect(data).toMatchObject({
        app: { name: 'SkillBridge' },
        support: { email: 'help@example.com' },
        smtp: {
          host: 'smtp.example.com',
          port: 2525,
          secure: true,
          username: 'mailer',
          password: 'super-secret',
          fromEmail: 'noreply@example.com',
          fromName: 'SkillBridge Notifications',
        },
        branding: {
          logoUrl: 'https://example.com/logo.png',
        },
      });
      cb(null, '', '');
    });

    const res = await request(app)
      .post('/api/install/run')
      .set('x-install-setup-secret', 'setup-secret')
      .send({
        adminEmail: 'admin@example.com',
        adminPassword: 'password123',
        appName: 'SkillBridge',
        supportEmail: 'help@example.com',
        smtpHost: 'smtp.example.com',
        smtpPort: 2525,
        smtpSecure: true,
        smtpUser: 'mailer',
        smtpPass: 'super-secret',
        smtpFromEmail: 'noreply@example.com',
        smtpFromName: 'SkillBridge Notifications',
        logoUrl: 'https://example.com/logo.png',
      });

    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledTimes(1);
    const [, options] = execFile.mock.calls[0];
    expect(options.env).toEqual(
      expect.objectContaining({
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'password123',
        INSTALLER_CONFIG_PATH: capturedConfigPath,
      })
    );
    expect(fs.existsSync(capturedConfigPath)).toBe(false);
  });
});
