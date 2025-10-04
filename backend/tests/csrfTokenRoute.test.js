process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
process.env.SESSION_SECRET = 'sessionsecret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const csrf = require('../src/middleware/csrf');
const csrfRoute = require('../src/routes/csrf.routes');

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
  app.use(csrf);
  app.use('/api/csrf-token', csrfRoute);
  return app;
}

describe('GET /api/csrf-token', () => {
  it('sets csrfToken cookie and returns the token payload', async () => {
    const app = createApp();
    const res = await request(app).get('/api/csrf-token');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('csrfToken=')])
    );
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token === 'string' && res.body.token.length > 0).toBe(
      true
    );
  });
});
