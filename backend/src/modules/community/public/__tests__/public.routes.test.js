const request = require('supertest');
const express = require('express');

jest.mock('../public.service', () => ({
  listDiscussions: jest.fn(),
  getDiscussion: jest.fn(),
  createDiscussion: jest.fn(),
}));
const service = require('../public.service');

jest.mock('../../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));
jest.mock('../../../messages/messages.service', () => ({
  createMessage: jest.fn(),
}));
jest.mock('../../../users/user.model', () => ({
  findAdmins: jest.fn(() => [{ id: 'a1', full_name: 'Admin' }]),
  findInstructors: jest.fn(() => []),
  findStudents: jest.fn(() => []),
  findContactInfo: jest.fn(() => ({ email: 'u@test.com', full_name: 'User' })),
}));
jest.mock('../../../../utils/email', () => ({
  sendNewDiscussionEmail: jest.fn(),
}));

jest.mock('../../../../middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1', full_name: 'Test User' }; next(); },
}));

const routes = require('../public.routes');
const app = express();
app.use(express.json());
app.use('/community', routes);

describe('community public routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('create discussion', async () => {
    const disc = { id: 'd1', title: 't', content: 'c' };
    service.createDiscussion.mockResolvedValue(disc);
    const res = await request(app).post('/community/discussions').send({ title: 't', content: 'c' });
    expect(res.statusCode).toBe(200);
    expect(service.createDiscussion).toHaveBeenCalledWith({
      user_id: 'u1',
      user_name: 'Test User',
      title: 't',
      content: 'c',
      tags: undefined,
    });
    expect(res.body.data).toEqual(disc);
  });
});
