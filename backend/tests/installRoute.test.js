const fs = require('fs');
const path = require('path');
const request = require('supertest');

jest.setTimeout(10000);

function getServer(enableInstall) {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test';
  process.env.REFRESH_TOKEN_SECRET = 'test';
  process.env.SESSION_SECRET = 'test';
  process.env.TEST_DATABASE_URL = 'postgresql://localhost/testdb';
  if (enableInstall === undefined) {
    delete process.env.ENABLE_INSTALL;
  } else {
    process.env.ENABLE_INSTALL = enableInstall;
  }
  return require('../src/server');
}

describe('/install route', () => {
  it('returns 410 when ENABLE_INSTALL is not set to true', async () => {
    const { app, server, io } = getServer();
    const res = await request(app).get('/install');
    io?.close();
    server.close();
    expect(res.status).toBe(410);
  });

  it('serves installer when ENABLE_INSTALL is true', async () => {
    const { app, server, io } = getServer('true');
    const res = await request(app).get('/install/');
    io?.close();
    server?.close();
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('id="installerConfigForm"');
    expect(res.text).toContain('Database connection URL');
    expect(res.text).toContain('SMTP host');
    expect(res.text).toContain('Application display name');
    expect(res.text).toContain('Admin email');
    expect(res.text).toContain('Admin password');
    expect(res.text).toContain('Default “from” email');
    expect(res.text).toContain('id="progressBar"');
    expect(res.text).toContain('data-stepper-item="prereq"');
    expect(res.text).toContain('data-stepper-item="config"');
    expect(res.text).toContain('data-stepper-item="install"');
    expect(res.text).toContain('Prerequisites');
    expect(res.text).toContain('Configuration');
    expect(res.text).toContain('Run Install');
  });
  it('serves installer assets from the packaged layout when present', async () => {
    const packagedInstallerDir = path.join(__dirname, '../install');
    const packagedIndexFile = path.join(packagedInstallerDir, 'index.html');
    const monorepoInstallerDir = path.join(__dirname, '../../install');
    const monorepoBackupDir = `${monorepoInstallerDir}.test-backup`;

    // Hide the monorepo assets so the packaged path is preferred
    let monorepoRenamed = false;
    if (fs.existsSync(monorepoInstallerDir)) {
      fs.rmSync(monorepoBackupDir, { recursive: true, force: true });
      fs.renameSync(monorepoInstallerDir, monorepoBackupDir);
      monorepoRenamed = true;
    }

    fs.mkdirSync(packagedInstallerDir, { recursive: true });
    fs.writeFileSync(
      packagedIndexFile,
      '<!DOCTYPE html><html><body><h1>Packaged Installer</h1></body></html>'
    );

    try {
      const { app, server, io } = getServer('true');
      const res = await request(app).get('/install/');
      io?.close();
      server.close();

      expect(res.status).toBe(200);
      expect(res.text).toContain('Packaged Installer');
    } finally {
      fs.rmSync(packagedInstallerDir, { recursive: true, force: true });
      if (monorepoRenamed) {
        fs.renameSync(monorepoBackupDir, monorepoInstallerDir);
      }
    }
  });
});
