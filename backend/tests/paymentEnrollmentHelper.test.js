jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid-123') }));

jest.mock('../src/modules/classes/enrollments/classEnrollment.service', () => ({
  findEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
  createEnrollment: jest.fn(),
}));

jest.mock('../src/modules/users/tutorials/enrollments/tutorialEnrollment.service', () => ({
  createEnrollment: jest.fn(),
}));

jest.mock('../src/modules/classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../src/utils/logger.js', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const { handleEnrollment } = require('../src/modules/payments/helpers/enrollment');
const enrollmentService = require('../src/modules/classes/enrollments/classEnrollment.service');
const classService = require('../src/modules/classes/class.service');
const logger = require('../src/utils/logger.js');

describe('handleEnrollment class availability checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips enrollment when class is unpublished', async () => {
    classService.getClassById.mockResolvedValue({
      id: 'c1',
      status: 'draft',
      moderation_status: 'Approved',
    });

    await handleEnrollment('class', 'user1', 'c1');

    expect(classService.getClassById).toHaveBeenCalledWith('c1');
    expect(enrollmentService.createEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.updateEnrollment).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Enrollment skipped: Class is not available for enrollment'
    );
  });

  it('skips enrollment when class is rejected', async () => {
    classService.getClassById.mockResolvedValue({
      id: 'c1',
      status: 'published',
      moderation_status: 'Rejected',
    });

    await handleEnrollment('class', 'user1', 'c1');

    expect(enrollmentService.createEnrollment).not.toHaveBeenCalled();
    expect(enrollmentService.updateEnrollment).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Enrollment skipped: Class is not available for enrollment'
    );
  });

  it('creates enrollment when class is published and approved', async () => {
    classService.getClassById.mockResolvedValue({
      id: 'c1',
      status: 'published',
      moderation_status: 'Approved',
    });
    enrollmentService.findEnrollment.mockResolvedValue(null);

    await handleEnrollment('class', 'user1', 'c1');

    expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
      id: 'uuid-123',
      user_id: 'user1',
      class_id: 'c1',
      status: 'enrolled',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
