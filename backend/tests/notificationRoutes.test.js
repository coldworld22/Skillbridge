const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/notifications/notifications.service', () => ({
  getUserNotifications: jest.fn(),
  markAsRead: jest.fn(),
  createNotification: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/notifications/notifications.service');
const routes = require('../src/modules/notifications/notifications.routes');

const app = express();
app.use(express.json());
app.use('/api/notifications', routes);

describe('GET /api/notifications', () => {
  it('returns notifications list', async () => {
    const mock = [{ id: '1' }];
    service.getUserNotifications.mockResolvedValue(mock);
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mock);
    expect(service.getUserNotifications).toHaveBeenCalledWith('user1');
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('marks notification as read', async () => {
    const mockNote = { id: '1', read: true };
    service.markAsRead.mockResolvedValue(mockNote);
    const res = await request(app).patch('/api/notifications/1/read');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockNote);
    expect(service.markAsRead).toHaveBeenCalledWith('1', 'user1');
  });
});

describe('POST /api/notifications', () => {
  it('creates notification', async () => {
    const payload = { user_id: '2', type: 'info', message: 'hello' };
    const mockNote = { id: 'n1', ...payload };
    service.createNotification.mockResolvedValue(mockNote);
    const res = await request(app).post('/api/notifications').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(mockNote);
    expect(service.createNotification).toHaveBeenCalledWith(payload);
  });
});
