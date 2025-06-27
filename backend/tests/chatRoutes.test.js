const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/chat/chat.service', () => ({
  searchUsers: jest.fn(),
  getConversation: jest.fn(),
  sendMessage: jest.fn(),
  deleteMessage: jest.fn(),
  togglePin: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const service = require('../src/modules/chat/chat.service');
const routes = require('../src/modules/chat/chat.routes');

const app = express();
app.use(express.json());
app.use('/api/chat', routes);

describe('GET /api/chat/users', () => {
  it('searches users', async () => {
    const users = [{ id: '2', name: 'Jane' }];
    service.searchUsers.mockResolvedValue(users);
    const res = await request(app).get('/api/chat/users?q=j');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(users);
    expect(service.searchUsers).toHaveBeenCalledWith('user1', 'j');
  });
});

describe('GET /api/chat/:userId', () => {
  it('returns conversation', async () => {
    const convo = [{ id: '1', message: 'hi' }];
    service.getConversation.mockResolvedValue(convo);
    const res = await request(app).get('/api/chat/2');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(convo);
    expect(service.getConversation).toHaveBeenCalledWith('user1', '2');
  });
});

describe('POST /api/chat/:userId', () => {
  it('sends message', async () => {
    const payload = { message: 'hey' };
    const msg = { id: '1', message: 'hey' };
    service.sendMessage.mockResolvedValue(msg);
    const res = await request(app).post('/api/chat/2').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(msg);
    expect(service.sendMessage).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '2',
      message: 'hey',
      file_url: null,
      audio_url: null,
      reply_to_id: null,
    });
  });
});

describe('DELETE /api/chat/messages/:id', () => {
  it('deletes message', async () => {
    const msg = { id: '1' };
    service.deleteMessage.mockResolvedValue(msg);
    const res = await request(app).delete('/api/chat/messages/1');
    expect(res.status).toBe(200);
    expect(service.deleteMessage).toHaveBeenCalledWith('user1', '1');
  });
});

describe('PATCH /api/chat/messages/:id/pin', () => {
  it('toggles pin', async () => {
    const msg = { id: '1', pinned: true };
    service.togglePin.mockResolvedValue(msg);
    const res = await request(app).patch('/api/chat/messages/1/pin');
    expect(res.status).toBe(200);
    expect(service.togglePin).toHaveBeenCalledWith('user1', '1');
  });
});
