const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/messages/messages.service', () => ({
  getUserMessages: jest.fn(),
  markAsRead: jest.fn(),
  deleteMessage: jest.fn(),
  sendEmail: jest.fn(),
  sendWhatsApp: jest.fn(),
  startVideoCall: jest.fn(),
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

describe('DELETE /api/messages/:id', () => {
  it('deletes message', async () => {
    const msg = { id: '1' };
    service.deleteMessage.mockResolvedValue(msg);
    const res = await request(app).delete('/api/messages/1');
    expect(res.status).toBe(200);
    expect(service.deleteMessage).toHaveBeenCalledWith('user1', '1');
  });
});

describe('POST /api/messages/:id/email', () => {
  it('sends email', async () => {
    const data = { id: '1' };
    service.sendEmail.mockResolvedValue(data);
    const res = await request(app)
      .post('/api/messages/2/email')
      .send({ subject: 'Hi', message: 'Hello' });
    expect(res.status).toBe(200);
    expect(service.sendEmail).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '2',
      subject: 'Hi',
      message: 'Hello',
    });
  });
});

describe('POST /api/messages/:id/whatsapp', () => {
  it('sends whatsapp message', async () => {
    const data = { id: '1' };
    service.sendWhatsApp.mockResolvedValue(data);
    const res = await request(app)
      .post('/api/messages/2/whatsapp')
      .send({ message: 'Hello' });
    expect(res.status).toBe(200);
    expect(service.sendWhatsApp).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '2',
      message: 'Hello',
    });
  });
});

describe('POST /api/messages/:id/video-call', () => {
  it('starts video call', async () => {
    const data = { roomId: 'abc' };
    service.startVideoCall.mockResolvedValue(data);
    const res = await request(app).post('/api/messages/2/video-call');
    expect(res.status).toBe(200);
    expect(service.startVideoCall).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '2',
    });
  });
});
