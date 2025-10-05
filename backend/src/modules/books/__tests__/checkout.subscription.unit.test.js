jest.mock('../../../config/database', () => ({
  transaction: jest.fn(),
}));

jest.mock('../../paymentMethods/paymentMethods.service', () => ({
  getByType: jest.fn(),
}));

jest.mock('../../payments/helpers/methods', () => ({
  getPlanCoveredMethod: jest.fn(),
}));

jest.mock('../../payments/helpers/wallet', () => ({
  creditInstructorSubscription: jest.fn(),
}));

jest.mock('../../plans/subscription.helper', () => ({
  getActiveStudentSubscription: jest.fn(),
}));

jest.mock('../../paymentConfig/paymentConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../payments/payments.service', () => ({
  STATUS: { PAID: 'paid', AWAITING_APPROVAL: 'awaiting_approval' },
  create: jest.fn(),
}));

jest.mock('../../library/library.service', () => ({
  recordPurchase: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'payment-uuid',
}));

const db = require('../../../config/database');
const paymentMethodsService = require('../../paymentMethods/paymentMethods.service');
const { getPlanCoveredMethod } = require('../../payments/helpers/methods');
const { creditInstructorSubscription } = require('../../payments/helpers/wallet');
const { getActiveStudentSubscription } = require('../../plans/subscription.helper');
const libraryService = require('../../library/library.service');
const { checkout } = require('../book.service');

describe('checkout subscription coverage (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentMethodsService.getByType.mockImplementation((type) => {
      if (type === 'bank') {
        return { id: 'bank-method' };
      }
      throw new Error(`Unexpected payment type: ${type}`);
    });
    getPlanCoveredMethod.mockResolvedValue({ id: 'subscription-method' });
    getActiveStudentSubscription.mockResolvedValue({
      id: 'subscription-1',
      plan_id: 'plan-1',
    });
    libraryService.recordPurchase.mockResolvedValue(undefined);
  });

  test('credits instructor when book checkout is covered by subscription', async () => {
    const insertedPayments = [];
    const insertedPurchases = [];

    const bookCartQuery = {
      where: jest.fn(() => bookCartQuery),
      whereIn: jest.fn(() => bookCartQuery),
      select: jest.fn(async () => [{ book_id: 'book-1' }]),
      del: jest.fn(async () => undefined),
    };

    const bookPurchasesQuery = {
      where: jest.fn(() => bookPurchasesQuery),
      whereIn: jest.fn(() => bookPurchasesQuery),
      select: jest.fn(async () => []),
      insert: jest.fn(async (data) => {
        insertedPurchases.push(data);
        return [data];
      }),
    };

    const booksQuery = {
      whereIn: jest.fn(() => booksQuery),
      where: jest.fn(() => booksQuery),
      select: jest.fn(async () => [
        { id: 'book-1', price: 15, included_plans: ['plan-1'] },
      ]),
    };

    const paymentsQuery = {
      insert: jest.fn(async (data) => {
        insertedPayments.push(data);
        return [data];
      }),
    };

    db.transaction.mockImplementation(async (callback) => {
      const trx = (table) => {
        switch (table) {
          case 'book_cart':
            return bookCartQuery;
          case 'book_purchases':
            return bookPurchasesQuery;
          case 'books':
            return booksQuery;
          case 'payments':
            return paymentsQuery;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      };
      return callback(trx);
    });

    const payments = await checkout('student-1');

    expect(bookCartQuery.select).toHaveBeenCalledTimes(1);
    expect(bookPurchasesQuery.select).toHaveBeenCalledTimes(1);
    expect(booksQuery.select).toHaveBeenCalledTimes(1);
    expect(paymentsQuery.insert).toHaveBeenCalledTimes(1);

    expect(insertedPayments).toHaveLength(1);
    expect(insertedPayments[0]).toMatchObject({
      method_id: 'subscription-method',
      amount: 0,
      source: 'subscription',
    });

    expect(insertedPurchases).toContainEqual({
      student_id: 'student-1',
      book_id: 'book-1',
      price_paid: 0,
    });

    expect(payments).toEqual([
      expect.objectContaining({
        id: 'payment-uuid',
        method_id: 'subscription-method',
        amount: 0,
      }),
    ]);

    expect(creditInstructorSubscription).toHaveBeenCalledTimes(1);
    expect(creditInstructorSubscription).toHaveBeenCalledWith(
      'book',
      'book-1',
      'plan-1',
      'subscription-1',
      expect.any(Function)
    );
    expect(libraryService.recordPurchase).not.toHaveBeenCalled();
  });
});
