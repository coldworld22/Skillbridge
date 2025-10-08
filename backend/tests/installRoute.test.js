const request = require('supertest');

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
  it('returns 404 when ENABLE_INSTALL is not set to true', async () => {
    const { app, io, server } = getServer();
    const res = await request(app).get('/install');
    io.close();
    server.close();
    expect(res.status).toBe(404);
  });

  it('serves installer when ENABLE_INSTALL is true', async () => {
    const { app, io, server } = getServer('true');
    const res = await request(app).get('/install/');
    io.close();
    server.close();
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
  });
});
