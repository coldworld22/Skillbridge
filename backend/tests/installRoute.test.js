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
    server?.close();
    expect(res.status).toBe(410);
  });

  it('serves installer when ENABLE_INSTALL is true', async () => {
    const { app, server, io } = getServer('true');
    const res = await request(app).get('/install/');
    io?.close();
    server?.close();
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('id="configForm"');
    expect(res.text).toContain('Admin Email');
    expect(res.text).toContain('Admin Password');
    expect(res.text).toContain('id="progressBar"');
    expect(res.text).toContain('data-stepper-item="prereq"');
    expect(res.text).toContain('data-stepper-item="config"');
    expect(res.text).toContain('data-stepper-item="install"');
    expect(res.text).toContain('Prerequisites');
    expect(res.text).toContain('Configuration');
    expect(res.text).toContain('Run Install');
  });

  it('serves installer when only Docker layout assets exist', async () => {
    const path = require('path');
    const fs = require('fs');

    const serverDir = path.join(__dirname, '../src');
    const monorepoInstallerPath = path.resolve(serverDir, '../../install');
    const dockerInstallerPath = path.resolve(serverDir, '../install');

    const dockerInstallerPreviouslyExists = fs.existsSync(dockerInstallerPath);
    const dockerIndexPath = path.join(dockerInstallerPath, 'index.html');
    const dockerIndexPreviouslyExists = fs.existsSync(dockerIndexPath);
    const previousDockerIndexContent = dockerIndexPreviouslyExists
      ? fs.readFileSync(dockerIndexPath, 'utf8')
      : null;

    if (!dockerInstallerPreviouslyExists) {
      fs.mkdirSync(dockerInstallerPath, { recursive: true });
    }
    fs.writeFileSync(
      dockerIndexPath,
      '<!DOCTYPE html><html><body>Docker Installer</body></html>'
    );

    const realExistsSync = fs.existsSync;
    const existsSpy = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation((candidatePath) => {
        if (candidatePath === monorepoInstallerPath) {
          return false;
        }
        if (candidatePath === dockerInstallerPath) {
          return true;
        }
        return realExistsSync(candidatePath);
      });

    const { app, server, io } = getServer('true');
    existsSpy.mockRestore();

    const res = await request(app).get('/install/');

    io?.close();
    server?.close();

    expect(res.status).toBe(200);
    expect(res.text).toContain('Docker Installer');

    if (dockerIndexPreviouslyExists) {
      fs.writeFileSync(dockerIndexPath, previousDockerIndexContent);
    } else {
      fs.unlinkSync(dockerIndexPath);
    }

    if (!dockerInstallerPreviouslyExists) {
      fs.rmSync(dockerInstallerPath, { recursive: true, force: true });
    }
  });
});
