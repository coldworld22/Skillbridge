jest.mock('../../../config/database', () => {
  const plans = {
    'plan-student': { id: 'plan-student', slug: 'student-slug', target_role: 'student' },
    'student-slug': { id: 'plan-student', slug: 'student-slug', target_role: 'student' },
    'plan-inst': { id: 'plan-inst', slug: 'inst-slug', target_role: 'instructor' },
    'inst-slug': { id: 'plan-inst', slug: 'inst-slug', target_role: 'instructor' }
  };
  return jest.fn((table) => ({
    where(cond) {
      this.cond = cond;
      return this;
    },
    first() {
      if (table === 'plans') {
        const key = this.cond.id || this.cond.slug;
        return Promise.resolve(plans[key] || null);
      }
      return Promise.resolve(null);
    }
  }));
});

jest.mock('../class.service', () => ({
  createClass: jest.fn(),
  addClassTags: jest.fn(),
  getClassTags: jest.fn(),
  getClassById: jest.fn(),
  updateClass: jest.fn(),
}));

jest.mock('../classTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../messages/messages.service', () => ({
  createMessage: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../users/user.model', () => ({
  findAdmins: jest.fn(() => []),
  findById: jest.fn(() => ({ id: 'instructor1', full_name: 'Test Instructor' })),
}));

jest.mock('../../plans/instructor.helper', () => ({
  getActiveInstructorPlan: jest.fn(() => Promise.resolve({}))
}));
jest.mock('../../plans/plans.service', () => ({ getPlanById: jest.fn() }));
const planService = require('../../plans/plans.service');

const controller = require('../class.controller');
const service = require('../class.service');

describe('class.controller createClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planService.getPlanById.mockResolvedValue({
      features: [{ feature_key: 'classes_create', value: 'true' }],
    });
  });

  test('instructor cannot create class for another instructor', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { instructor_id: 'other', title: 'Test', status: 'published' },
      user: { id: 'instructor1', role: 'instructor' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      res.json.mockImplementation((data) => {
        resolve();
        return data;
      });
      next.mockImplementation((err) => {
        resolve();
        return err;
      });
      controller.createClass(req, res, next);
    });

    expect(next).not.toHaveBeenCalled();
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ instructor_id: 'instructor1' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructor_id: 'instructor1' }),
      })
    );
  });

  test('resolves plan slugs to ids', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', included_plans: ['student-slug'], access_type: 'free' },
      user: { id: 'admin1', role: 'admin' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      res.json.mockImplementation((data) => {
        resolve();
        return data;
      });
      next.mockImplementation((err) => {
        resolve();
        return err;
      });
      controller.createClass(req, res, next);
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          included_plans: ['plan-student'],
          access_type: 'free',
          price: 0,
        }),
      })
    );
  });

  test('rejects non-student plan', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', included_plans: ['inst-slug'], access_type: 'free' },
      user: { id: 'admin1', role: 'admin' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      next.mockImplementation((err) => {
        resolve();
        return err;
      });
      controller.createClass(req, res, next);
    });

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Invalid included plan');
  });

  test('rejects free class without included plans', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', access_type: 'free' },
      user: { id: 'admin1', role: 'admin' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      next.mockImplementation((err) => {
        resolve();
        return err;
      });
      controller.createClass(req, res, next);
    });

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe(
      'Free classes must include at least one student plan'
    );
  });

  test('rejects paid class with included plans', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', included_plans: ['student-slug'], access_type: 'paid' },
      user: { id: 'admin1', role: 'admin' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      next.mockImplementation((err) => {
        resolve();
        return err;
      });
      controller.createClass(req, res, next);
    });

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe(
      'Paid classes cannot include student plans'
    );
  });
});

describe('class.controller updateClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('instructor cannot change instructor_id', async () => {
    service.getClassById.mockResolvedValue({
      id: 'class1',
      instructor_id: 'instructor1',
      title: 'Title',
    });
    service.updateClass.mockImplementation(async (_id, data) => data);

    const req = {
      params: { id: 'class1' },
      body: { instructor_id: 'other' },
      user: { id: 'instructor1', role: 'instructor' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      res.json.mockImplementation((data) => {
        resolve();
        return data;
      });
      controller.updateClass(req, res, next);
    });

    expect(service.updateClass).toHaveBeenCalledWith(
      'class1',
      expect.objectContaining({ instructor_id: 'instructor1' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructor_id: 'instructor1' }),
      })
    );
  });

  test('admin can change instructor_id', async () => {
    service.getClassById.mockResolvedValue({
      id: 'class1',
      instructor_id: 'admin1',
      title: 'Title',
    });
    service.updateClass.mockImplementation(async (_id, data) => data);

    const req = {
      params: { id: 'class1' },
      body: { instructor_id: 'newInst' },
      user: { id: 'admin1', role: 'admin', full_name: 'Admin' },
      files: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await new Promise((resolve) => {
      res.json.mockImplementation((data) => {
        resolve();
        return data;
      });
      controller.updateClass(req, res, next);
    });

    expect(service.updateClass).toHaveBeenCalledWith(
      'class1',
      expect.objectContaining({ instructor_id: 'newInst' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructor_id: 'newInst' }),
      })
    );
  });
});
