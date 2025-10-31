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
  getJoinRequestById: jest.fn(),
  getJoinRequest: jest.fn(),
  countMembers: jest.fn(),
  countGroupsOwnedByUser: jest.fn(),
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
jest.mock('../../users/user.model', () => ({
  findContactInfo: jest.fn(),
  findStudents: jest.fn(),
  findInstructors: jest.fn(),
  findAdmins: jest.fn(),
}));

const controller = require('../groups.controller');
const service = require('../groups.service');
const planService = require('../../plans/plans.service');
const AppError = require('../../../utils/AppError');
const userModel = require('../../users/user.model');

describe('group plan limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findStudents.mockResolvedValue([]);
    userModel.findInstructors.mockResolvedValue([]);
    userModel.findAdmins.mockResolvedValue([]);
    service.listAdminIds.mockResolvedValue([]);
    service.requestJoin.mockResolvedValue({ id: 'req1', status: 'pending' });
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

  test('createGroup enforces ownership limit for instructor basic plan', async () => {
    planService.getPlanById.mockResolvedValue({
      slug: 'instructor-basic',
      features: [{ feature_key: 'groups_create', value: 'true' }],
    });
    service.countGroupsOwnedByUser.mockResolvedValue(1);
    const req = {
      user: { id: 'u1', role: 'instructor', plan_id: 1 },
      body: { name: 'Test' },
    };
    const res = {};
    await new Promise((resolve) => {
      controller.createGroup(req, res, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toMatch(/up to 1 group/i);
        resolve();
      });
    });
    expect(service.createGroup).not.toHaveBeenCalled();
  });

  test('createGroup uses fallback plan slug from user profile when plan lookup missing', async () => {
    service.countGroupsOwnedByUser.mockResolvedValue(0);
    service.findByName.mockResolvedValue(false);
    service.createGroup.mockResolvedValue({ id: 'g1' });
    service.addMember.mockResolvedValue({});
    const req = {
      user: {
        id: 'u1',
        role: 'instructor',
        plan: { slug: 'instructor_basic' },
      },
      body: { name: 'Fallback Test' },
    };
    const res = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn();
    await controller.createGroup(req, res, (err) => {
      throw err;
    });
    expect(service.createGroup).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('createGroup allows platform admin without plan subscription', async () => {
    service.findByName.mockResolvedValue(false);
    service.createGroup.mockResolvedValue({ id: 'g2' });
    service.addMember.mockResolvedValue({});
    const req = {
      user: { id: 'admin-1', role: 'admin' },
      body: { name: 'Admin Group' },
    };
    const res = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn();

    await controller.createGroup(req, res, (err) => {
      throw err;
    });

    expect(service.countGroupsOwnedByUser).not.toHaveBeenCalled();
    expect(service.createGroup).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createGroup falls back to minimal role limit when plan unknown', async () => {
    service.countGroupsOwnedByUser.mockResolvedValue(0);
    service.findByName.mockResolvedValue(false);
    service.createGroup.mockResolvedValue({ id: 'g3' });
    service.addMember.mockResolvedValue({});
    const req = {
      user: { id: 'u2', role: 'Instructor' },
      body: { name: 'Fallback Role Limit' },
    };
    const res = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn();

    await controller.createGroup(req, res, (err) => {
      throw err;
    });

    expect(service.countGroupsOwnedByUser).toHaveBeenCalled();
    expect(service.createGroup).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('joinGroup fails when join limit reached', async () => {
    planService.getPlanById.mockResolvedValue({
      features: [{ feature_key: 'groups_join_limit', value: '1' }],
    });
    service.getGroupById.mockResolvedValue({ requires_approval: false, name: 'G' });
    service.getMemberRole.mockResolvedValue(null);
    service.getJoinRequest.mockResolvedValue(null);
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

  test('joinGroup queues request for private group even without explicit approval flag', async () => {
    service.getGroupById.mockResolvedValue({
      requires_approval: false,
      visibility: 'private',
      name: 'Private Group',
    });
    service.getMemberRole.mockResolvedValue(null);
    service.getJoinRequest.mockResolvedValue(null);
    service.countUserGroups.mockResolvedValue(0);

    const req = { params: { id: 'g5' }, user: { id: 'u5' } };
    const res = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn();

    await controller.joinGroup(req, res, (err) => {
      throw err;
    });

    expect(service.requestJoin).toHaveBeenCalledWith('g5', 'u5');
    expect(service.addMember).not.toHaveBeenCalled();
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.data.status).toBe('pending');
  });

  test('joinGroup still sends approval request even when group explicitly allows it', async () => {
    service.getGroupById.mockResolvedValue({
      requires_approval: false,
      visibility: 'public',
      name: 'Open Group',
    });
    service.getMemberRole.mockResolvedValue(null);
    service.getJoinRequest.mockResolvedValue(null);
    service.countUserGroups.mockResolvedValue(0);
    const memberRow = { id: 'member-1', role: 'member' };
    service.addMember.mockResolvedValue(memberRow);

    const req = { params: { id: 'g6' }, user: { id: 'u6' } };
    const res = {};
    res.status = jest.fn().mockImplementation(() => res);
    res.json = jest.fn();

    await controller.joinGroup(req, res, (err) => {
      throw err;
    });

    expect(service.requestJoin).toHaveBeenCalledWith('g6', 'u6');
    expect(service.addMember).not.toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.status).toBe('pending');
  });
});
