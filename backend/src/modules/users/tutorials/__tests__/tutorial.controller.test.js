const httpMocks = require('node-mocks-http');

jest.mock('../tutorial.service', () => ({
  getAllTutorials: jest.fn(),
}));

jest.mock('../../../notifications/notifications.service', () => ({}));
jest.mock('../../../messages/messages.service', () => ({}));
jest.mock('../../user.model', () => ({}));
jest.mock('../../../../services/analyticsService', () => ({}));
jest.mock('../certificate/certificate.service', () => ({}));
jest.mock('../enrollments/tutorialEnrollment.service', () => ({}));
jest.mock('../../../plans/instructor.helper', () => ({
  getActiveInstructorPlan: jest.fn(),
}));
jest.mock('../../../plans/plans.service', () => ({}));
jest.mock('../../../../utils/planFeatures', () => ({
  parsePlanFeatures: jest.fn(() => ({})),
}));
jest.mock('../tutorial.validator', () => ({
  create: { parse: jest.fn((value) => value) },
  update: { parseAsync: jest.fn(async (value) => value) },
}));
jest.mock('../../../../utils/role', () => ({
  normalizeRole: jest.fn(() => 'admin'),
}));
jest.mock('../../../../utils/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../../../utils/email', () => ({
  sendTutorialApprovedEmail: jest.fn(),
  sendTutorialRejectedEmail: jest.fn(),
}));
jest.mock('../tutorial.helpers', () => ({
  parseTags: jest.fn((tags) => tags),
  parseChapters: jest.fn((chapters) => chapters),
}));
jest.mock('../tutorial.notifications', () => ({
  sendCreationNotifications: jest.fn(),
}));

jest.mock('../../../../utils/response', () => ({
  sendSuccess: jest.fn(),
}));

const service = require('../tutorial.service');
const { sendSuccess } = require('../../../../utils/response');
const controller = require('../tutorial.controller');

describe('tutorial.controller getAllTutorials approval filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards approval query parameter to the service', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      query: { approval: 'Approved', page: '2', limit: '5' },
    });
    const res = httpMocks.createResponse();
    const result = {
      data: [{ id: '1', moderation_status: 'Approved' }],
      meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
    };
    service.getAllTutorials.mockResolvedValue(result);

    await controller.getAllTutorials(req, res);

    expect(service.getAllTutorials).toHaveBeenCalledWith({
      status: undefined,
      category: undefined,
      search: undefined,
      approval: 'Approved',
      page: '2',
      limit: '5',
    });
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      result.data,
      'Tutorials fetched',
      result.meta
    );
  });

  it('defaults pagination when only approval filter is provided', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      query: { approval: 'Rejected' },
    });
    const res = httpMocks.createResponse();
    const result = {
      data: [{ id: '2', moderation_status: 'Rejected' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    service.getAllTutorials.mockResolvedValue(result);

    await controller.getAllTutorials(req, res);

    expect(service.getAllTutorials).toHaveBeenLastCalledWith({
      status: undefined,
      category: undefined,
      search: undefined,
      approval: 'Rejected',
      page: 1,
      limit: 10,
    });
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      result.data,
      'Tutorials fetched',
      result.meta
    );
  });
});
