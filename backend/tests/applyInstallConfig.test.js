const fs = require('fs');
const path = require('path');
const os = require('os');
const knex = require('knex');

const { applyInstallerConfig } = require('../scripts/apply-install-config');

describe('applyInstallerConfig', () => {
  let tempDir;
  let backendRoot;
  let envPath;
  let db;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'installer-config-'));
    backendRoot = path.join(tempDir, 'backend');
    await fs.promises.mkdir(backendRoot, { recursive: true });
    envPath = path.join(backendRoot, '.env');
    await fs.promises.writeFile(envPath, 'BACKEND_PORT=5002\n', 'utf8');

    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });

    await db.schema.createTable('settings', (table) => {
      table.increments('id');
      table.string('key').notNullable().unique();
      table.text('value').notNullable();
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  });

  afterEach(async () => {
    if (db) {
      await db.destroy();
      db = null;
    }

    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it('writes environment values, saves the logo, and upserts settings', async () => {
    const config = {
      app: { name: 'SkillBridge Pro' },
      support: { email: 'help@example.com' },
      smtp: {
        host: 'smtp.example.com',
        port: 2525,
        secure: false,
        username: 'mailer',
        password: 'secret',
        fromEmail: 'noreply@example.com',
        fromName: 'SkillBridge Mailer',
      },
      branding: {
        logoFile: {
          filename: 'logo.png',
          data: Buffer.from('fake-image').toString('base64'),
          contentType: 'image/png',
        },
      },
    };

    const configPath = path.join(tempDir, 'config.json');
    await fs.promises.writeFile(configPath, JSON.stringify(config), 'utf8');

    const result = await applyInstallerConfig({
      configPath,
      backendRoot,
      db,
    });

    const envContent = await fs.promises.readFile(envPath, 'utf8');
    expect(envContent).toContain('SMTP_HOST=smtp.example.com');
    expect(envContent).toContain('SMTP_PORT=2525');
    expect(envContent).toContain('SMTP_SECURE=false');
    expect(envContent).toContain('SMTP_USER=mailer');
    expect(envContent).toContain('SMTP_PASS=secret');
    expect(envContent).toContain('SUPPORT_EMAIL=help@example.com');

    const uploadsDir = path.join(backendRoot, 'uploads', 'app');
    const files = await fs.promises.readdir(uploadsDir);
    expect(files.length).toBe(1);
    const savedLogoPath = path.join(uploadsDir, files[0]);
    const savedLogo = await fs.promises.readFile(savedLogoPath);
    expect(savedLogo.length).toBeGreaterThan(0);
    expect(result.logoPath).toBe(`/uploads/app/${files[0]}`);

    const appSettingsRow = await db('settings').where({ key: 'app_settings' }).first();
    const emailSettingsRow = await db('settings').where({ key: 'email_settings' }).first();
    expect(appSettingsRow).toBeTruthy();
    expect(emailSettingsRow).toBeTruthy();

    const appSettings = JSON.parse(appSettingsRow.value);
    expect(appSettings.appName).toBe('SkillBridge Pro');
    expect(appSettings.contactEmail).toBe('help@example.com');
    expect(appSettings.logo_url).toBe(`/uploads/app/${files[0]}`);

    const emailSettings = JSON.parse(emailSettingsRow.value);
    expect(emailSettings.smtpHost).toBe('smtp.example.com');
    expect(emailSettings.smtpPort).toBe(2525);
    expect(emailSettings.secure).toBeUndefined();
    expect(emailSettings.username).toBe('mailer');
    expect(emailSettings.password).toBe('secret');
    expect(emailSettings.fromEmail).toBe('noreply@example.com');
    expect(emailSettings.fromName).toBe('SkillBridge Mailer');
    expect(emailSettings.replyTo).toBe('help@example.com');
    expect(emailSettings.encryption).toBe('STARTTLS');
    expect(emailSettings.method).toBe('smtp');
  });
});
