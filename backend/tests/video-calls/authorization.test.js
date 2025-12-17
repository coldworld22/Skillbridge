const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database', () => {
  return jest.fn((table) => {
    if (table === 'online_classes') {
      return {
        select: () => ({
          where: () => ({ first: () => Promise.resolve({ instructor_id: 'instructor1' }) }),
        }),
      };
    }
    if (table === 'class_enrollments') {
      return {
        where: () => ({ first: () => Promise.resolve(null) }),
      };
    }
    return {};
  });
});

const verifyEnrollment = require('../../src/middleware/auth/verifyEnrollment');

const app = express();
app.use(express.json());
// Mock verifyToken to attach a user to the request
const verifyToken = (req, _res, next) => {
  req.user = { id: 'user1' };
  next();
};

app.get('/api/video-calls/:roomId/participants', verifyToken, verifyEnrollment, (_req, res) => res.json([]));
app.get('/api/video-calls/:roomId/messages', verifyToken, verifyEnrollment, (_req, res) => res.json([]));
app.post('/api/video-calls/:roomId/messages', verifyToken, verifyEnrollment, (_req, res) => res.status(201).json({}));

describe('video call authorization', () => {
  it('rejects unauthorized participants fetch', async () => {
    const res = await request(app).get('/api/video-calls/cls1/participants');
    expect(res.status).toBe(403);
  });

  it('rejects unauthorized messages fetch', async () => {
    const res = await request(app).get('/api/video-calls/cls1/messages');
    expect(res.status).toBe(403);
  });

  it('rejects unauthorized message post', async () => {
    const res = await request(app)
      .post('/api/video-calls/cls1/messages')
      .send({ text: 'hi' });
    expect(res.status).toBe(403);
  });
});
