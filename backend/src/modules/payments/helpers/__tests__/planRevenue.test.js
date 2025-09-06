jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  return db;
});

jest.mock('../platformFee', () => ({
  calculatePlatformFee: jest.fn(() => ({ instructor_amount: 80 })),
}));

const db = require('../../../config/database');
const { calculateInstructorAmount } = require('../planRevenue');
const { calculatePlatformFee } = require('../platformFee');

describe('calculateInstructorAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies commission rate to usage amount', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 2 })
      .mockResolvedValueOnce({ price_monthly: 100 });

    const amt = await calculateInstructorAmount(
      'plan1',
      'item1',
      null,
      'tutorial'
    );
    expect(amt).toBeCloseTo(40);
    expect(db).toHaveBeenCalledWith('plan_usage_metrics');
    expect(calculatePlatformFee).toHaveBeenCalledWith('tutorial', 100);
  });

  it('returns 0 when plan not found', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 1 })
      .mockResolvedValueOnce(null);
    const amt = await calculateInstructorAmount('plan1', 'item1');
    expect(amt).toBe(0);
  });
});

