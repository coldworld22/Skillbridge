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
  verifyToken: (req, _res, next) => {
    req.user = { id: 'u1', full_name: 'Test User', plan_id: 'plan1' };
    next();
  },
}));

const routes = require('../public.routes');
jest.mock('../../../plans/plans.service', () => ({ getPlanById: jest.fn() }));
const planService = require('../../../plans/plans.service');
const app = express();
app.use(express.json());
app.use('/community', routes);

describe('community public routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [{ feature_key: 'community_post', value: 'true' }],
    });
  });

  test('create discussion', async () => {
    const disc = { id: 'd1', title: 't', content: 'c', tags: ['tag1'] };
    service.createDiscussion.mockResolvedValue(disc);
    const res = await request(app)
      .post('/community/discussions')
      .field('title', 't')
      .field('content', 'c')
      .field('tags', JSON.stringify(['tag1']))
      .attach('image', Buffer.from('img'), 'a.png');
    expect(res.statusCode).toBe(200);
    expect(service.createDiscussion).toHaveBeenCalled();
    expect(res.body.data).toEqual(disc);
  });

  test('blocks discussion when feature disabled', async () => {
    planService.getPlanById.mockResolvedValueOnce({
      id: 'plan1',
      features: [{ feature_key: 'community_post', value: 'false' }],
    });
    const res = await request(app)
      .post('/community/discussions')
      .field('title', 't')
      .field('content', 'c')
      .field('tags', JSON.stringify(['tag1']));
    expect(res.statusCode).toBe(403);
    expect(service.createDiscussion).not.toHaveBeenCalled();
  });
});
