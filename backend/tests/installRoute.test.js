const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

jest.setTimeout(15000);

function getServer(options = {}) {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test';
  process.env.REFRESH_TOKEN_SECRET = 'test';
  process.env.SESSION_SECRET = 'test';
  process.env.TEST_DATABASE_URL = 'postgresql://localhost/testdb';
  if (options.enableInstall === undefined) {
    delete process.env.ENABLE_INSTALL;
  } else {
    process.env.ENABLE_INSTALL = options.enableInstall;
  }
  if (options.disableInstall === undefined) {
    delete process.env.DISABLE_INSTALL;
  } else {
    process.env.DISABLE_INSTALL = options.disableInstall;
  }
  if (options.installDir === undefined) {
    delete process.env.INSTALL_DIR;
  } else {
    process.env.INSTALL_DIR = options.installDir;
  }
  delete process.env.INSTALL_API_ENABLED;
  return require('../src/server');
}

describe('/install route', () => {
  it('serves installer when ENABLE_INSTALL is true', async () => {
    const { app, io, server } = getServer({ enableInstall: 'true' });
    try {
      const res = await request(app).get('/install/').expect(200);
      expect(res.text).toContain('<!DOCTYPE html>');
    } finally {
      io.close();
      server.close();
    }
  });

  it('serves installer by default when assets are present', async () => {
    const { app, io, server } = getServer();
    try {
      const res = await request(app).get('/install').expect(200);
      expect(res.text).toContain('<!DOCTYPE html>');
    } finally {
      io.close();
      server.close();
    }
  });

  it('returns 404 when installer is explicitly disabled', async () => {
    const { app, io, server } = getServer({ disableInstall: 'true' });
    try {
      await request(app).get('/install').expect(404);
    } finally {
      io.close();
      server.close();
    }
  });

  it('returns 404 when assets are missing even if enabled', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-install-'));
    fs.rmSync(tempDir, { recursive: true, force: true });
    const { app, io, server } = getServer({ enableInstall: 'true', installDir: tempDir });
    try {
      await request(app).get('/install').expect(404);
    } finally {
      io.close();
      server.close();
    }
  });
});
