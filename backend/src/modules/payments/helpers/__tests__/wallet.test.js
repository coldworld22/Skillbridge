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
const {
  creditInstructorSubscription,
  creditTutorialSubscription,
} = require('../wallet');
const classService = require('../../../classes/class.service');
const tutorialService = require('../../../users/tutorials/tutorial.service');

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
    planRevenue.calculateInstructorAmount.mockResolvedValue(8.75);
    classService.getClassById.mockResolvedValue({ instructor_id: 'inst-8' });

    await expect(
      creditInstructorSubscription(
        'class',
        'class-2',
        'plan-10',
        'sub-4',
        trx,
        8.75
      )
    ).resolves.toBe(8.75);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-10',
      'sub-4',
      'class-2',
      trx,
      'class',
      { precomputedAmount: 8.75 }
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-8', 8.75, trx);
  });
});

describe('creditTutorialSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits the tutorial instructor wallet for plan-covered enrollment payouts', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(5.25);
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'inst-9' });

    await expect(
      creditTutorialSubscription('tutorial-1', 'plan-11', 'sub-5', trx)
    ).resolves.toBe(5.25);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-11',
      'sub-5',
      'tutorial-1',
      trx,
      'tutorial',
      {}
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-9', 5.25, trx);
  });
});
