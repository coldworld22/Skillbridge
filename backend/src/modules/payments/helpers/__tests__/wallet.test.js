jest.mock('../../../payouts/wallet.service', () => ({
  increment: jest.fn(),
}));

jest.mock('../planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));

jest.mock('../../../books/book.service', () => ({
  getBookById: jest.fn(),
}));

jest.mock('../../../classes/class.service', () => ({
  getClassById: jest.fn(),
}));

jest.mock('../../../users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn(),
}));

jest.mock('../../../../utils/logger.js', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
}));

const walletService = require('../../../payouts/wallet.service');
const planRevenue = require('../planRevenue');
const { creditInstructorSubscription } = require('../wallet');
const classService = require('../../../classes/class.service');

describe('creditInstructorSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits instructor wallet using subscription metrics', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(12.34);
    classService.getClassById.mockResolvedValue({ instructor_id: 'inst-7' });

    await expect(
      creditInstructorSubscription('class', 'class-1', 'plan-9', 'sub-3', trx)
    ).resolves.toBe(12.34);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-9',
      'sub-3',
      'class-1',
      trx,
      'class',
      {}
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-7', 12.34, trx);
  });

  it('uses precomputed amount when provided without querying plan revenue', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(0);
    classService.getClassById.mockResolvedValue({ instructor_id: 'inst-8' });

    await expect(
      creditInstructorSubscription(
        'class',
        'class-2',
        'plan-10',
        'sub-4',
        trx,
        { precomputedAmount: 8.75 }
      )
    ).resolves.toBe(8.75);

    expect(planRevenue.calculateInstructorAmount).not.toHaveBeenCalled();
    expect(walletService.increment).toHaveBeenCalledWith('inst-8', 8.75, trx);
  });
});
