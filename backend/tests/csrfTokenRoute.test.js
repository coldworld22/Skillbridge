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
  it('sets csrfToken cookie and returns 204', async () => {
    const app = createApp();
    const res = await request(app).get('/api/csrf-token');
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('csrfToken=')])
    );
  });
});
