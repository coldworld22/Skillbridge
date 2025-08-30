const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/groups/groups.service', () => ({
  findByName: jest.fn(),
  createGroup: jest.fn(),
  syncGroupTags: jest.fn(),
  addMember: jest.fn(),
  getGroupById: jest.fn(),
  getUserGroups: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({}));
jest.mock('../src/modules/notifications/notifications.service', () => ({}));
jest.mock('../src/modules/messages/messages.service', () => ({}));
jest.mock('../src/services/mailService', () => ({}));
jest.mock('../src/services/whatsappService', () => ({}));
jest.mock('../src/config/database', () => {
  const { newDb } = require('pg-mem');
  return newDb().adapters.createKnex();
});

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: (req, _res, next) => { req.user = { id: 'u1', plan_id: 'plan1', full_name: 'User One' }; next(); },
}));

const groupService = require('../src/modules/groups/groups.service');
const planService = require('../src/modules/plans/plans.service');
const routes = require('../src/modules/groups/groups.routes');

const app = express();
app.use(express.json());
app.use('/api/groups', routes);

describe('group feature restrictions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('denies group creation when feature disabled', async () => {
    planService.getPlanById.mockResolvedValue({ features: [{ feature_key: 'groups_create', value: 'false' }] });
    groupService.findByName.mockResolvedValue(null);
    const res = await request(app).post('/api/groups').send({ name: 'Test' });
    expect(res.status).toBe(403);
    expect(groupService.createGroup).not.toHaveBeenCalled();
  });

  it('denies joining when join limit reached', async () => {
    planService.getPlanById.mockResolvedValue({ features: [{ feature_key: 'groups_join_limit', value: '1' }] });
    groupService.getUserGroups.mockResolvedValue([{ id: 'g1', role: 'member' }]);
    groupService.getGroupById.mockResolvedValue({ id: 'g2', requires_approval: false });
    const res = await request(app).post('/api/groups/g2/join');
    expect(res.status).toBe(403);
    expect(groupService.addMember).not.toHaveBeenCalled();
  });
});
