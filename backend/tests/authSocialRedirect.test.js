const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('../src/middleware/csrf');

jest.mock('../src/config/passport', () => ({
  passport: { authenticate: jest.fn() },
}));

jest.mock('../src/utils/frontend', () => ({
  frontendBase: 'http://frontend.com',
  allowedOrigins: ['http://frontend.com', 'https://allowed.com'],
}));

const { passport } = require('../src/config/passport');
const { googleCallback } = require('../src/modules/auth/controllers/socialAuth.controller');

const app = express();
app.use(cookieParser());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(csrf);
app.get('/api/auth/google/callback', googleCallback);

describe('social auth redirect', () => {
  beforeEach(() => {
    passport.authenticate.mockImplementation((strategy, opts, cb) => {
      return (req, res, next) => cb(null, { accessToken: 'a', refreshToken: 'r' });
    });
  });

  it('redirects to allowed origin without exposing token', async () => {
    const res = await request(app)
      .get('/api/auth/google/callback')
      .query({ origin: 'https://allowed.com' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://allowed.com/auth/social-success');
    expect(res.headers.location).not.toContain('token=');
  });

  it('falls back to frontendBase for unapproved origin', async () => {
    const res = await request(app)
      .get('/api/auth/google/callback')
      .query({ origin: 'https://evil.com' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://frontend.com/auth/social-success');
    expect(res.headers.location).not.toContain('token=');
  });

  it('sets refresh and csrf cookies', async () => {
    const res = await request(app).get('/api/auth/google/callback');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken=r'),
        expect.stringContaining('csrfToken='),
      ])
    );
  });
});
