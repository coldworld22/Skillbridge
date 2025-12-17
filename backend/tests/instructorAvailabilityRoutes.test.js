const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
const db = require('../src/config/database');
const updateMock = jest.fn().mockResolvedValue();
db.mockImplementation(() => ({
  where: () => ({ update: updateMock })
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
  isInstructor: (_req, _res, next) => next(),
}));

const routes = require('../src/modules/users/instructor/instructor.routes');

const app = express();
app.use(express.json());
app.use('/api/users/instructor', routes);

describe('PATCH /api/users/instructor/availability validation', () => {
  beforeEach(() => {
    updateMock.mockClear();
  });

  it('rejects slot with missing required fields', async () => {
    const res = await request(app)
      .patch('/api/users/instructor/availability')
      .send({
        availability: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            startTime: '09:00',
            endTime: '10:00',
            daysOfWeek: [1],
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects slot with invalid time format', async () => {
    const res = await request(app)
      .patch('/api/users/instructor/availability')
      .send({
        availability: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Morning',
            startTime: '25:00',
            endTime: '26:00',
            daysOfWeek: [1],
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects overlapping slots', async () => {
    const res = await request(app)
      .patch('/api/users/instructor/availability')
      .send({
        availability: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Slot1',
            startTime: '09:00',
            endTime: '10:00',
            daysOfWeek: [1],
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174000',
            title: 'Slot2',
            startTime: '09:30',
            endTime: '10:30',
            daysOfWeek: [1],
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
