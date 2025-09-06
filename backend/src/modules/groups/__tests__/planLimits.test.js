jest.mock('../../../config/database', () => ({}));
jest.mock('../groups.service', () => ({
  findByName: jest.fn(),
  createGroup: jest.fn(),
  addMember: jest.fn(),
  syncGroupTags: jest.fn(),
  getGroupById: jest.fn(),
  requestJoin: jest.fn(),
  listAdminIds: jest.fn(),
  getMemberRole: jest.fn(),
  countUserGroups: jest.fn(),
}));
jest.mock('../../plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));
jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));
jest.mock('../../messages/messages.service', () => ({
  createMessage: jest.fn(),
  sendEmail: jest.fn(),
}));
jest.mock('../../../services/mailService', () => ({ sendMail: jest.fn() }));
jest.mock('../../../services/whatsappService', () => ({ sendWhatsApp: jest.fn() }));
jest.mock('../../../utils/frontend', () => ({ frontendBase: 'http://test' }));

const controller = require('../groups.controller');
const service = require('../groups.service');
const planService = require('../../plans/plans.service');
const AppError = require('../../../utils/AppError');

describe('group plan limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createGroup fails when plan disallows creation', async () => {
    planService.getPlanById.mockResolvedValue({
      features: [{ feature_key: 'groups_create', value: 'false' }],
    });
    const req = { user: { id: 'u1', plan_id: 1 }, body: { name: 'Test' } };
    const res = {};
    await new Promise((resolve) => {
      controller.createGroup(req, res, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toMatch(/upgrade plan/i);
        resolve();
      });
    });
    expect(service.createGroup).not.toHaveBeenCalled();
  });

  test('joinGroup fails when join limit reached', async () => {
    planService.getPlanById.mockResolvedValue({
      features: [{ feature_key: 'groups_join_limit', value: '1' }],
    });
    service.getGroupById.mockResolvedValue({ requires_approval: false, name: 'G' });
    service.getMemberRole.mockResolvedValue(null);
    service.countUserGroups.mockResolvedValue(1);
    const req = { params: { id: 'g2' }, user: { id: 'u1', plan_id: 1 } };
    const res = {};
    await new Promise((resolve) => {
      controller.joinGroup(req, res, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toMatch(/upgrade plan/i);
        resolve();
      });
    });
    expect(service.addMember).not.toHaveBeenCalled();
  });
});

