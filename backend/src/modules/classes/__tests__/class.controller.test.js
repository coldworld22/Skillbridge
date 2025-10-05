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
  togglePublishStatus: jest.fn(),
  countPublishedClasses: jest.fn(),
  updateModeration: jest.fn(),
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
  getActiveInstructorPlan: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../../plans/plans.service', () => ({ getPlanById: jest.fn() }));
const planService = require('../../plans/plans.service');

const controller = require('../class.controller');
const service = require('../class.service');
const { getActiveInstructorPlan } = require('../../plans/instructor.helper');
const notificationService = require('../../notifications/notifications.service');
const AppError = require('../../../utils/AppError');

describe('class.controller createClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveInstructorPlan.mockResolvedValue({});
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
      expect.objectContaining({ instructor_id: 'instructor1', access_type: 'paid' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructor_id: 'instructor1', access_type: 'paid' }),
      })
    );
  });

  test('resolves plan slugs to ids', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', included_plans: ['student-slug'] },
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
        data: expect.objectContaining({ included_plans: ['plan-student'] })
      })
    );
  });

  test('rejects malformed tags payload', async () => {
    const req = {
      body: { title: 'Test', tags: '{not-json}' },
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

    expect(service.createClass).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toBe('Invalid tags format. Expected an array of strings.');
  });

  test('allows creating free access classes when specified', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Free Class', access_type: 'free' },
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
    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ access_type: 'free' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ access_type: 'free' }),
      })
    );
  });

  test('auto-approves published classes created by admins', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: {
        title: 'Admin Published Class',
        status: 'published',
        instructor_id: 'instructor1',
        publish_immediately: 'true',
      },
      user: { id: 'admin1', role: 'admin', roles: ['admin'] },
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
      expect.objectContaining({
        status: 'published',
        moderation_status: 'Approved',
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'published',
          moderation_status: 'Approved',
        }),
      })
    );
  });

  test('instructors requesting publish immediately still require approval', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: {
        title: 'Instructor Published Class',
        status: 'published',
        publish_immediately: 'true',
      },
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
      expect.objectContaining({
        status: 'published',
        moderation_status: 'Pending',
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'published',
          moderation_status: 'Pending',
        }),
      })
    );
  });

  test('rejects non-student plan', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { title: 'Test', included_plans: ['inst-slug'] },
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
});

describe('class.controller updateClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveInstructorPlan.mockResolvedValue({});
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

  test('update rejects malformed tags payload', async () => {
    service.getClassById.mockResolvedValue({
      id: 'class1',
      instructor_id: 'admin1',
      title: 'Title',
    });

    const req = {
      params: { id: 'class1' },
      body: { tags: '{not-json}' },
      user: { id: 'admin1', role: 'admin', full_name: 'Admin' },
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
      controller.updateClass(req, res, next);
    });

    expect(service.updateClass).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toBe('Invalid tags format. Expected an array of strings.');
  });
});

describe('class.controller approveClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveInstructorPlan.mockResolvedValue({});
  });

  test('rejects approval when instructor is at course capacity', async () => {
    service.getClassById.mockResolvedValue({
      id: 'class1',
      instructor_id: 'instructor1',
      status: 'draft',
    });
    getActiveInstructorPlan.mockResolvedValue({ id: 'plan1', max_courses: 1 });
    service.countPublishedClasses.mockResolvedValue(1);

    const req = { params: { id: 'class1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await new Promise((resolve) => {
      next.mockImplementation((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Course limit reached for your plan');
        resolve();
        return err;
      });
      controller.approveClass(req, res, next);
    });

    expect(service.countPublishedClasses).toHaveBeenCalledWith('instructor1');
    expect(service.updateModeration).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });
});
