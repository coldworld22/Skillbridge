const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
const db = require('../src/config/database');

db.mockImplementation(() => ({
  where: () => ({
    update: () => ({
      returning: () => Promise.resolve([{ id: 'user1', is_online: true }])
    })
  })
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
  isInstructor: (_req, _res, next) => next(),
}));

const routes = require('../src/modules/users/instructor/instructor.routes');
const app = express();
app.use(express.json());
app.use('/api/users/instructor', routes);

describe('PATCH /api/users/instructor/status', () => {
  it('updates online status and returns new value', async () => {
    const res = await request(app)
      .patch('/api/users/instructor/status')
      .send({ is_online: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Status set to online',
      is_online: true,
    });
  });
});
