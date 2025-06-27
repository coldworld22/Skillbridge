const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/messages/messages.service', () => ({
  getUserMessages: jest.fn(),
  markAsRead: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/messages/messages.service');
const routes = require('../src/modules/messages/messages.routes');

const app = express();
app.use(express.json());
app.use('/api/messages', routes);

describe('GET /api/messages', () => {
  it('returns user messages', async () => {
    const msgs = [{ id: '1', message: 'hello' }];
    service.getUserMessages.mockResolvedValue(msgs);
    const res = await request(app).get('/api/messages');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(msgs);
    expect(service.getUserMessages).toHaveBeenCalledWith('user1');
  });
});

describe('PATCH /api/messages/:id/read', () => {
  it('marks message as read', async () => {
    const msg = { id: '1', read: true };
    service.markAsRead.mockResolvedValue(msg);
    const res = await request(app).patch('/api/messages/1/read');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(msg);
    expect(service.markAsRead).toHaveBeenCalledWith('1', 'user1');
  });
});
