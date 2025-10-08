const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/messages/messages.service', () => ({
  sendEmail: jest.fn(),
  sendWhatsApp: jest.fn(),
  startVideoCall: jest.fn(),
}));

jest.mock('../src/modules/students/student.service', () => ({}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'user1' }; next(); },
}));

const msgService = require('../src/modules/messages/messages.service');
const routes = require('../src/modules/students/student.routes');

const app = express();
app.use(express.json());
app.use('/api/students', routes);

describe('POST /api/students/:id/email', () => {
  it('sends email to student', async () => {
    msgService.sendEmail.mockResolvedValue({});
    const res = await request(app)
      .post('/api/students/123e4567-e89b-12d3-a456-426614174000/email')
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

describe('POST /api/students/:id/whatsapp', () => {
  it('sends whatsapp to student', async () => {
    msgService.sendWhatsApp.mockResolvedValue({});
    const res = await request(app)
      .post('/api/students/123e4567-e89b-12d3-a456-426614174000/whatsapp')
      .send({ message: 'Hello' });
    expect(res.status).toBe(200);
    expect(msgService.sendWhatsApp).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '123e4567-e89b-12d3-a456-426614174000',
      message: 'Hello',
    });
  });
});

describe('POST /api/students/:id/video-call', () => {
  it('starts video call with student', async () => {
    msgService.startVideoCall.mockResolvedValue({ roomId: 'abc' });
    const res = await request(app).post('/api/students/123e4567-e89b-12d3-a456-426614174000/video-call');
    expect(res.status).toBe(200);
    expect(msgService.startVideoCall).toHaveBeenCalledWith({
      sender_id: 'user1',
      receiver_id: '123e4567-e89b-12d3-a456-426614174000',
    });
  });
});
