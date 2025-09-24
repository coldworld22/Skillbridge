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

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
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

    try {
      const res = await request(app).get('/install/');
      expect(res.status).toBe(200);
      const html = res.text;

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('id="configForm"');
      expect(html).toContain('id="progressBar"');
      expect(html).toContain('data-stepper-item="prereq"');
      expect(html).toContain('data-stepper-item="config"');
      expect(html).toContain('data-stepper-item="install"');
      expect(html).toContain('Prerequisites');
      expect(html).toContain('Configuration');
      expect(html).toContain('Run Install');
      expect(html).toContain('Admin Email');
      expect(html).toContain('Admin Password');
      expect(html).toContain('Application Name');
      expect(html).toContain('Support Email');
      expect(html).toContain('SMTP Host');
      expect(html).toContain('SMTP Username');
      expect(html).toContain('From Email (optional)');

      expect(countOccurrences(html, 'id="configForm"')).toBe(1);
      expect(countOccurrences(html, 'id="checkBtn"')).toBe(1);
      expect(countOccurrences(html, 'id="installBtn"')).toBe(1);
      expect(countOccurrences(html, 'id="backToConfigBtn"')).toBe(1);
      expect(countOccurrences(html, 'id="step-prereq"')).toBe(1);
      expect(countOccurrences(html, 'id="step-config"')).toBe(1);
      expect(countOccurrences(html, 'id="step-install"')).toBe(1);

      const scriptRes = await request(app).get('/install/install.js');
      expect(scriptRes.status).toBe(200);
      expect(scriptRes.text).toContain('document.addEventListener');
    } finally {
      io?.close();
      server?.close();
    }
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
      try {
        const res = await request(app).get('/install/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Packaged Installer');
      } finally {
        io?.close();
        server?.close();
      }
    } finally {
      fs.rmSync(packagedInstallerDir, { recursive: true, force: true });
      if (monorepoRenamed) {
        fs.renameSync(monorepoBackupDir, monorepoInstallerDir);
      }
    }
  });
});
