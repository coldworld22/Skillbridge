const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database', () => {
  return jest.fn((table) => {
    if (table === 'video_call_participants') {
      return {
        select: () => ({
          where: () => ({
            andWhere: () => ({
              first: () => Promise.resolve({ role: 'participant' })
            })
          })
        })
      };
    }
    return {};
  });
});

const verifyHostRole = require('../../src/middleware/auth/verifyHostRole');

const app = express();
app.use(express.json());
const attachUser = (req, _res, next) => { req.user = { id: 'user1' }; next(); };

global.userSockets = { user1: 'socket1' };

app.patch('/api/video-calls/:roomId/participants/:id', attachUser, verifyHostRole, (_req, res) => res.json({}));
app.delete('/api/video-calls/:roomId/participants/:id', attachUser, verifyHostRole, (_req, res) => res.status(204).end());

describe('verifyHostRole middleware', () => {
  it('rejects non-host user for participant update', async () => {
    const res = await request(app)
      .patch('/api/video-calls/room1/participants/socket2')
      .send({ isMuted: true });
    expect(res.status).toBe(403);
  });

  it('rejects non-host user for participant removal', async () => {
    const res = await request(app)
      .delete('/api/video-calls/room1/participants/socket2');
    expect(res.status).toBe(403);
  });
});
