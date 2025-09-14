const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database', () => jest.fn());

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: '123e4567-e89b-12d3-a456-426614174001' };
    next();
  },
  isInstructor: (_req, _res, next) => next(),
}));

const routes = require('../src/modules/users/instructor/instructor.routes');
const db = require('../src/config/database');

const app = express();
app.use(express.json());
app.use('/api/users/instructor', routes);

describe('PATCH /api/users/instructor/:id/demo', () => {
  it('returns 403 when uploading demo video for another instructor', async () => {
    const res = await request(app)
      .patch('/api/users/instructor/123e4567-e89b-12d3-a456-426614174000/demo')
      .attach('demo', Buffer.from('test'), 'demo.mp4');

    expect(res.status).toBe(403);
    expect(db).not.toHaveBeenCalled();
  });
});
