jest.setTimeout(20000);

jest.mock('../../../paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(async () => ({ id: 'free', type: 'free', active: true })),
  getByType: jest.fn(async () => ({ id: 'free', type: 'free', active: true })),
}));

jest.mock('../../../books/book.service', () => ({
  getBookById: jest.fn(async (id) => ({ id, price: 15, included_plans: ['plan-1'] })),
}));

jest.mock('../../../plans/plans.service', () => ({
  getPlanById: jest.fn(async () => ({ id: 'plan-1' })),
}));

// Simulate active subscription for the user
jest.mock('../../../plans/subscription.helper', () => ({
  getActiveStudentPlanId: jest.fn(async () => 'plan-1'),
}));

const { validatePaymentData } = require('../validation');

describe('validatePaymentData for plan-covered book', () => {
  test('forces free payment when book included in active plan', async () => {
    const userId = 'stu1';
    const result = await validatePaymentData(
      { item_type: 'book', item_id: 123, amount: 0, status: 'paid' },
      userId
    );
    expect(result.finalStatus).toBe('paid');
    expect(result.verifiedAmount).toBe(0);
    expect(result.subscriptionPlanId).toBe('plan-1');
  });
});

