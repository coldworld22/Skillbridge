const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');

jest.mock('../src/modules/groups/groupMessages.service', () => ({
  createMessage: jest.fn(),
  listMessages: jest.fn(),
  deleteMessage: jest.fn(),
  getMessageById: jest.fn(),
}));

jest.mock('../src/modules/groups/groups.service', () => ({
  getMemberRole: jest.fn(),
  getGroupPermissions: jest.fn(),
  getGroupById: jest.fn(),
  listMembers: jest.fn(),
  getJoinRequestById: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: 'u1', full_name: 'User One' };
    next();
  },
}));

const msgService = require('../src/modules/groups/groupMessages.service');
const groupService = require('../src/modules/groups/groups.service');
const notificationService = require('../src/modules/notifications/notifications.service');
const messageService = require('../src/modules/messages/messages.service');
const routes = require('../src/modules/groups/groups.routes');

const app = express();
app.use(express.json());
app.use('/api/groups', routes);
app.use(errorHandler);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/groups/:id/messages permissions', () => {
  it('rejects when message permission denied', async () => {
    groupService.getMemberRole.mockResolvedValue('member');
    groupService.getGroupPermissions.mockResolvedValue({
      admin: { message: true, upload: true },
      moderator: { message: true, upload: true },
      member: { message: false, upload: false },
    });
    const res = await request(app)
      .post('/api/groups/1/messages')
      .send({ message: 'hi' });
    expect(res.status).toBe(403);
    expect(msgService.createMessage).not.toHaveBeenCalled();
  });

  it('rejects uploads when upload permission denied', async () => {
    groupService.getMemberRole.mockResolvedValue('member');
    groupService.getGroupPermissions.mockResolvedValue({
      admin: { message: true, upload: true },
      moderator: { message: true, upload: true },
      member: { message: true, upload: false },
    });
    const res = await request(app)
      .post('/api/groups/1/messages')
      .attach('file', Buffer.from('hi'), { filename: 'hi.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
    expect(msgService.createMessage).not.toHaveBeenCalled();
  });

  it('allows message when permitted', async () => {
    groupService.getMemberRole.mockResolvedValue('member');
    groupService.getGroupPermissions.mockResolvedValue({
      admin: { message: true, upload: true },
      moderator: { message: true, upload: true },
      member: { message: true, upload: true },
    });
    msgService.createMessage.mockResolvedValue({ id: '1' });
    msgService.getMessageById.mockResolvedValue({ id: '1', content: 'hi' });
    groupService.getGroupById.mockResolvedValue({ name: 'g' });
    groupService.listMembers.mockResolvedValue([{ user_id: 'u1' }]);
    notificationService.createNotification.mockResolvedValue({});
    messageService.createMessage.mockResolvedValue({});

    const res = await request(app)
      .post('/api/groups/1/messages')
      .send({ message: 'hi' });
    expect(res.status).toBe(200);
    expect(msgService.createMessage).toHaveBeenCalled();
  });
});
