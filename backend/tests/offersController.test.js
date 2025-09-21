process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://user:pass@localhost:5432/testdb';

jest.mock('../src/utils/catchAsync', () => (fn) => fn);

jest.mock('../src/modules/offers/offers.service', () => ({
  getOfferById: jest.fn(),
  updateOffer: jest.fn(),
  addOfferTags: jest.fn(),
  getOfferTags: jest.fn(),
}));

jest.mock('../src/modules/offers/offerTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
}));

jest.mock('../src/modules/users/user.model', () => ({
  findInstructors: jest.fn(),
  findStudents: jest.fn(),
  findAdmins: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/modules/messages/messages.service', () => ({
  createMessage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/mailService', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/utils/response', () => ({
  sendSuccess: jest.fn(),
}));

const { sendSuccess } = require('../src/utils/response');
const service = require('../src/modules/offers/offers.service');
const userModel = require('../src/modules/users/user.model');
const controller = require('../src/modules/offers/offers.controller');

describe('Offers Controller - updateOffer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getOfferById.mockResolvedValue({
      id: 'offer-1',
      student_id: 'student-1',
    });
    service.updateOffer.mockResolvedValue({ id: 'offer-1' });
    userModel.findInstructors.mockResolvedValue([]);
    userModel.findStudents.mockResolvedValue([]);
    userModel.findAdmins.mockResolvedValue([]);
  });

  it('allows a superadmin to update offers', async () => {
    const req = {
      params: { id: 'offer-1' },
      body: { status: 'open' },
      user: {
        id: 'super-admin',
        role: 'SuperAdmin',
        full_name: 'Super User',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await controller.updateOffer(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(service.updateOffer).toHaveBeenCalledWith('offer-1', { status: 'open' });
    expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'offer-1' }, 'Offer updated');
  });
});

