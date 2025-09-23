const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../src/modules/emailConfig/emailConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));
jest.mock('../src/modules/appConfig/appConfig.service', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));
jest.mock('../src/config/database', () => ({
  destroy: jest.fn(),
}));

describe('applyInstallerConfig', () => {
  let applyInstallerConfig;
  let tempRoot;
  let emailServiceMock;
  let appConfigServiceMock;
  let dbMock;

  beforeEach(() => {
    jest.resetModules();
    ({ applyInstallerConfig } = require('../scripts/apply-installer-config'));
    emailServiceMock = require('../src/modules/emailConfig/emailConfig.service');
    appConfigServiceMock = require('../src/modules/appConfig/appConfig.service');
    dbMock = require('../src/config/database');
    emailServiceMock.getSettings.mockReset();
    emailServiceMock.updateSettings.mockReset();
    appConfigServiceMock.getSettings.mockReset();
    appConfigServiceMock.updateSettings.mockReset();
    dbMock.destroy.mockReset();
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skillbridge-install-test-'));
  });

  afterEach(() => {
    if (tempRoot && fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('writes environment defaults and updates services for provided configuration', async () => {
    const config = {
      adminEmail: 'admin@example.com',
      adminPassword: 'password123',
      appName: 'SkillBridge Academy',
      supportEmail: 'support@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 2525,
        username: 'smtp-user',
        password: 'smtp-pass',
        fromEmail: 'noreply@example.com',
        fromName: 'SkillBridge',
        encryption: 'TLS',
        secure: true,
      },
      logoFile: {
        filename: 'logo.png',
        mimeType: 'image/png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAqZ3e7QAAAABJRU5ErkJggg==',
      },
    };

    const configPath = path.join(tempRoot, 'installer-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config));

    emailServiceMock.getSettings.mockResolvedValue({ method: 'smtp' });
    appConfigServiceMock.getSettings.mockResolvedValue({});
    dbMock.destroy.mockResolvedValue();

    await applyInstallerConfig(configPath, { backendRoot: tempRoot });

    const envPath = path.join(tempRoot, '.env');
    expect(fs.existsSync(envPath)).toBe(true);
    const envContent = fs.readFileSync(envPath, 'utf8');
    expect(envContent).toContain('APP_NAME="SkillBridge Academy"');
    expect(envContent).toContain('SUPPORT_EMAIL="support@example.com"');
    expect(envContent).toContain('SMTP_HOST=smtp.example.com');
    expect(envContent).toContain('SMTP_PORT=2525');
    expect(envContent).toContain('SMTP_SECURE=true');

    expect(emailServiceMock.updateSettings).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        smtpHost: 'smtp.example.com',
        smtpPort: 2525,
        username: 'smtp-user',
        password: 'smtp-pass',
        fromEmail: 'noreply@example.com',
        fromName: 'SkillBridge',
        encryption: 'TLS',
        secure: true,
        replyTo: 'support@example.com',
        method: 'smtp',
      })
    );

    expect(appConfigServiceMock.updateSettings).toHaveBeenCalledTimes(1);
    const appUpdatePayload = appConfigServiceMock.updateSettings.mock.calls[0][0];
    expect(appUpdatePayload).toMatchObject({
      appName: 'SkillBridge Academy',
      contactEmail: 'support@example.com',
      logo_url: expect.stringMatching(/^\/uploads\/app\//),
    });

    const relativeLogo = appUpdatePayload.logo_url.replace(/^\//, '');
    const absoluteLogoPath = path.join(tempRoot, relativeLogo);
    expect(fs.existsSync(absoluteLogoPath)).toBe(true);

    expect(dbMock.destroy).toHaveBeenCalledTimes(1);
  });
});
