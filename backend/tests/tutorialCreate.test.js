jest.mock('../src/config/database', () => {
  const mockDb = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
  }));
  mockDb.transaction = jest.fn(async (cb) => {
    await cb({});
  });
  mockDb.raw = jest.fn();
  return mockDb;
});

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  createTutorialWithRelations: jest.fn(),
  addTutorialTags: jest.fn(),
  getTutorialTags: jest.fn(),
  countPublishedTutorials: jest.fn(),
}));

jest.mock('../src/modules/users/tutorials/chapters/tutorialChapter.service', () => ({
  create: jest.fn(),
}));

jest.mock('../src/modules/users/tutorials/tutorialTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
  getTutorialTags: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findById: jest.fn(),
  findAdmins: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendTutorialCreatedAdminEmail: jest.fn(),
  sendTutorialCreatedInstructorEmail: jest.fn(),
  sendTutorialApprovedEmail: jest.fn(),
  sendTutorialRejectedEmail: jest.fn(),
}));

jest.mock('../src/modules/plans/instructor.helper', () => ({
  getActiveInstructorPlan: jest.fn(),
}));

jest.mock('../src/modules/plans/plans.service', () => ({
  getPlanById: jest.fn(),
}));

const controller = require('../src/modules/users/tutorials/tutorial.controller');
const service = require('../src/modules/users/tutorials/tutorial.service');
const userModel = require('../src/modules/users/user.model');
const db = require('../src/config/database');
const { getActiveInstructorPlan } = require('../src/modules/plans/instructor.helper');
const planService = require('../src/modules/plans/plans.service');


describe('createTutorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findAdmins.mockResolvedValue([]);
    getActiveInstructorPlan.mockResolvedValue({ id: 'plan1' });
    planService.getPlanById.mockResolvedValue({
      id: 'plan1',
      features: [
        { feature_key: 'tutorials_create', value: 'true' },
        { feature_key: 'tutorials_max_count', value: '10' },
      ],
    });
  });

  it('allows admin to create tutorial for another instructor', async () => {
    const instructorId = '11111111-1111-1111-1111-111111111111';
    userModel.findById.mockResolvedValue({ id: instructorId, full_name: 'Other Instructor', email: 'other@example.com' });
    service.createTutorialWithRelations.mockResolvedValue({ id: 'tut1' });

    const req = {
      body: {
        title: 'Test Tut',
        category_id: 'cat',
        level: 'beginner',
        instructor_id: instructorId,
      },
      user: { id: 'admin1', role: 'admin' },
      files: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createTutorial(req, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    expect(userModel.findById).toHaveBeenCalledWith(instructorId);
    expect(service.createTutorialWithRelations).toHaveBeenCalled();
    const data = service.createTutorialWithRelations.mock.calls[0][0];
    expect(data.instructor_id).toBe(instructorId);
  });

  it('prevents instructor from creating tutorial for another instructor', async () => {
    const otherId = '11111111-1111-1111-1111-111111111112';
    const myId = '22222222-2222-2222-2222-222222222222';
    userModel.findById.mockResolvedValue({ id: myId, full_name: 'Me', email: 'me@example.com' });
    service.createTutorialWithRelations.mockResolvedValue({ id: 'tut1' });

    const req = {
      body: {
        title: 'Another Tut',
        category_id: 'cat',
        level: 'beginner',
        instructor_id: otherId,
      },
      user: { id: myId, role: 'instructor' },
      files: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createTutorial(req, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    const data = service.createTutorialWithRelations.mock.calls[0][0];
    expect(data.instructor_id).toBe(myId);
  });

  it('sets is_paid to false when price is 0', async () => {
    service.createTutorialWithRelations.mockResolvedValue({ id: 'tutFree' });

    const req = {
      body: {
        title: 'Free Tut',
        category_id: 'cat',
        level: 'beginner',
        price: 0,
      },
      user: { id: 'inst1', role: 'instructor' },
      files: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createTutorial(req, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    const data = service.createTutorialWithRelations.mock.calls[0][0];
    expect(data.is_paid).toBe(false);
  });

  it('sets is_paid to true when price is greater than 0', async () => {
    service.createTutorialWithRelations.mockResolvedValue({ id: 'tutPaid' });

    const req = {
      body: {
        title: 'Paid Tut',
        category_id: 'cat',
        level: 'beginner',
        price: 10,
      },
      user: { id: 'inst1', role: 'instructor' },
      files: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createTutorial(req, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    const data = service.createTutorialWithRelations.mock.calls[0][0];
    expect(data.is_paid).toBe(true);
  });

  it('rejects duplicate titles regardless of case', async () => {
    const whereRaw = jest.fn().mockReturnThis();
    const first = jest.fn().mockResolvedValue({ id: 'existing' });
    db.mockImplementationOnce(() => ({ whereRaw, first }));

    const req = {
      body: {
        title: 'My Unique',
        category_id: 'cat',
        level: 'beginner',
      },
      user: { id: 'inst1', role: 'instructor' },
      files: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createTutorial(req, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));

    expect(whereRaw).toHaveBeenCalledWith('LOWER(title) = ?', 'my unique');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.createTutorialWithRelations).not.toHaveBeenCalled();
  });
});

