const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/messages/messages.service', () => ({
  sendEmail: jest.fn(),
  sendWhatsApp: jest.fn(),
  startVideoCall: jest.fn(),
}));

jest.mock('../src/modules/instructors/instructor.service', () => ({}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const msgService = require('../src/modules/messages/messages.service');
const routes = require('../src/modules/instructors/instructor.routes');

const app = express();
app.use(express.json());
app.use('/api/instructors', routes);

describe('POST /api/instructors/:id/email', () => {
  it('sends email to instructor', async () => {
    msgService.sendEmail.mockResolvedValue({});
    const res = await request(app)
      .post('/api/instructors/123e4567-e89b-12d3-a456-426614174000/email')
      .send({ subject: 'Hi', message: 'Hello' });
    expect(res.status).toBe(200);
    expect(msgService.sendEmail).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '123e4567-e89b-12d3-a456-426614174000',
      subject: 'Hi',
      message: 'Hello',
    });
  });
});

describe('POST /api/instructors/:id/whatsapp', () => {
  it('sends whatsapp to instructor', async () => {
    msgService.sendWhatsApp.mockResolvedValue({});
    const res = await request(app)
      .post('/api/instructors/123e4567-e89b-12d3-a456-426614174000/whatsapp')
      .send({ message: 'Hello' });
    expect(res.status).toBe(200);
    expect(msgService.sendWhatsApp).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '123e4567-e89b-12d3-a456-426614174000',
      message: 'Hello',
    });
  });
});

describe('POST /api/instructors/:id/video-call', () => {
  it('starts video call with instructor', async () => {
    msgService.startVideoCall.mockResolvedValue({ roomId: 'abc' });
    const res = await request(app).post('/api/instructors/123e4567-e89b-12d3-a456-426614174000/video-call');
    expect(res.status).toBe(200);
    expect(msgService.startVideoCall).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '123e4567-e89b-12d3-a456-426614174000',
    });
  });
});
