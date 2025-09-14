const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
const db = require('../src/config/database');

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 1 };
    next();
  },
  isInstructor: (_req, _res, next) => next(),
}));

const routes = require('../src/modules/users/instructor/instructor.routes');

const app = express();
app.use(express.json());
app.use('/api/users/instructor', routes);

describe('DELETE /api/users/instructor/:id/avatar', () => {
  it('denies deleting another user avatar', async () => {
    const res = await request(app).delete('/api/users/instructor/2/avatar');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden' });
    expect(db).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/users/instructor/:id/demo', () => {
  it('denies deleting another user demo video', async () => {
    const res = await request(app).delete('/api/users/instructor/2/demo');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden' });
    expect(db).not.toHaveBeenCalled();
  });
});

