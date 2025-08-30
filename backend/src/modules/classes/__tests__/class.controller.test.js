jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve(null));
  return db;
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

const controller = require('../class.controller');
const service = require('../class.service');

describe('class.controller createClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('instructor cannot create class for another instructor', async () => {
    service.createClass.mockImplementation(async (data) => data);

    const req = {
      body: { instructor_id: 'other', title: 'Test', status: 'published' },
      user: { id: 'instructor1', role: 'instructor' },
      files: {},
      subscription: { current_courses: 0, max_courses: 5 },
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
      controller.createClass(req, res, next);
    });

    expect(service.createClass).toHaveBeenCalledWith(
      expect.objectContaining({ instructor_id: 'instructor1' })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instructor_id: 'instructor1' }),
      })
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
