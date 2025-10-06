jest.mock('../../../payouts/wallet.service', () => ({
  increment: jest.fn(),
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

jest.mock('../planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));

const walletService = require('../../../payouts/wallet.service');
const bookService = require('../../../books/book.service');
const classService = require('../../../classes/class.service');
const tutorialService = require('../../../users/tutorials/tutorial.service');
const planRevenue = require('../planRevenue');
const walletHelpers = require('../wallet');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('creditInstructorSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calculates the payout and credits the instructor wallet', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(12.34);
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'inst-7' });

    await expect(
      walletHelpers.creditInstructorSubscription('tutorial', 'tutorial-1', 'plan-1', 'sub-1', trx)
    ).resolves.toBe(12.34);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-1',
      'sub-1',
      'tutorial-1',
      trx,
      'tutorial',
      {}
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-7', 12.34, trx);
  });

  it('passes a precomputed amount through to the calculator when provided', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(8.75);
    classService.getClassById.mockResolvedValue({ instructor_id: 'inst-8' });

    await expect(
      walletHelpers.creditInstructorSubscription('class', 'class-2', 'plan-10', 'sub-4', trx, 8.75)
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

  it('credits book instructors when applicable', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(4.5);
    bookService.getBookById.mockResolvedValue({ instructor_id: 'inst-book' });

    await expect(
      walletHelpers.creditInstructorSubscription('book', 'book-5', 'plan-9', 'sub-3', trx)
    ).resolves.toBe(4.5);

    expect(walletService.increment).toHaveBeenCalledWith('inst-book', 4.5, trx);
  });
});

describe('creditTutorialSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calculates the tutorial payout and credits the instructor wallet', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(5.25);
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'inst-9' });

    await expect(
      walletHelpers.creditTutorialSubscription('tutorial-1', 'plan-2', 'sub-3', trx)
    ).resolves.toBe(5.25);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-2',
      'sub-3',
      'tutorial-1',
      trx,
      'tutorial',
      {}
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-9', 5.25, trx);
  });

  it('supports passing a precomputed amount in legacy signatures', async () => {
    const trx = { trx: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(6.75);
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'inst-legacy' });

    await expect(
      walletHelpers.creditTutorialSubscription('tutorial-2', 'plan-4', 'sub-8', trx, 6.75, { reason: 'test' })
    ).resolves.toBe(6.75);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-4',
      'sub-8',
      'tutorial-2',
      trx,
      'tutorial',
      { precomputedAmount: 6.75, reason: 'test' }
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-legacy', 6.75, trx);
  });

  it('passes through options when provided as the fifth argument', async () => {
    const trx = { trx: true };
    const options = { ignoreCache: true };
    planRevenue.calculateInstructorAmount.mockResolvedValue(3.1);
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'inst-options' });

    await expect(
      walletHelpers.creditTutorialSubscription('tutorial-3', 'plan-5', 'sub-9', trx, options)
    ).resolves.toBe(3.1);

    expect(planRevenue.calculateInstructorAmount).toHaveBeenCalledWith(
      'plan-5',
      'sub-9',
      'tutorial-3',
      trx,
      'tutorial',
      options
    );
    expect(walletService.increment).toHaveBeenCalledWith('inst-options', 3.1, trx);
  });
});
