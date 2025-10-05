jest.mock('../../../payouts/wallet.service', () => ({
  increment: jest.fn(),
}));

jest.mock('../../../users/tutorials/tutorial.service', () => ({
  getTutorialById: jest.fn(),
}));

jest.mock('../planRevenue', () => ({
  calculateInstructorAmount: jest.fn(),
}));

const walletService = require('../../../payouts/wallet.service');
const tutorialService = require('../../../users/tutorials/tutorial.service');
const { creditTutorialSubscription } = require('../wallet');

describe('wallet helpers - creditTutorialSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits the instructor with the provided subscription amount', async () => {
    tutorialService.getTutorialById.mockResolvedValue({ instructor_id: 'instructor-42' });

    const amount = await creditTutorialSubscription(
      'tutorial-1',
      'plan-1',
      'subscription-1',
      null,
      25,
    );

    expect(walletService.increment).toHaveBeenCalledTimes(1);
    expect(walletService.increment).toHaveBeenCalledWith('instructor-42', 25, null);
    expect(walletService.increment.mock.calls[0][1]).toBeGreaterThan(0);
    expect(amount).toBe(25);
  });
});
