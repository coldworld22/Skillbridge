const mockSelect = jest.fn().mockResolvedValue([]);
const mockWhere = jest.fn().mockReturnValue({ select: mockSelect });
const mockTransaction = jest.fn(async (callback) => {
  const trx = jest.fn((table) => {
    if (table === 'book_cart') {
      return {
        where: mockWhere,
      };
    }
    throw new Error(`Unexpected table queried: ${table}`);
  });
  return callback(trx);
});

jest.mock('../../../config/database', () => {
  const mockDb = jest.fn();
  mockDb.transaction = mockTransaction;
  return mockDb;
});

const mockGetActiveStudentSubscription = jest.fn().mockResolvedValue(null);
const mockGetActiveStudentPlanId = jest.fn().mockResolvedValue(null);

jest.mock('../../plans/subscription.helper', () => ({
  getActiveStudentSubscription: mockGetActiveStudentSubscription,
  getActiveStudentPlanId: mockGetActiveStudentPlanId,
}));

jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(async () => ({ id: 'bank-method' })),
}));

jest.mock('../../paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn(async () => ({})),
}));

jest.mock('../../payments/helpers/methods', () => ({
  getPlanCoveredMethod: jest.fn(async () => ({ id: 'plan-method' })),
}));

jest.mock('../../payments/payments.service', () => ({
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval' },
  create: jest.fn(),
}));

jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(),
}));

jest.mock('../../payments/helpers/wallet', () => ({
  creditInstructorSubscription: jest.fn(),
  creditInstructorWallet: jest.fn(),
}));

const { checkout } = require('../book.service');

describe('checkout', () => {
  it('returns empty array when cart is empty and invokes subscription lookup', async () => {
    const result = await checkout('student-123');
    expect(result).toEqual([]);
    expect(mockGetActiveStudentSubscription).toHaveBeenCalledWith('student-123');
    expect(mockTransaction).toHaveBeenCalled();
  });
});
