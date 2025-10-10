jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  db.select = jest.fn();
  return db;
});

jest.mock('../platformFee', () => ({
  calculatePlatformFee: jest.fn(() => ({ instructor_amount: 80 })),
}));

const db = require('../../../../config/database');
const { calculateInstructorAmount } = require('../planRevenue');
const { calculatePlatformFee } = require('../platformFee');

describe('calculateInstructorAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses plan commission rate when available', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 2, instructor_amount: 20 })
      .mockResolvedValueOnce({ price_monthly: 100 });
    db.select.mockResolvedValueOnce([
      { feature_key: 'commission_rate', value: '0.3' },
    ]);

    const amt = await calculateInstructorAmount('plan1', 'item1');
    expect(amt).toBeCloseTo(15);
    expect(calculatePlatformFee).not.toHaveBeenCalled();
  });

  it('handles different commission rates', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 4, instructor_amount: 40 })
      .mockResolvedValueOnce({ price_monthly: 200 });
    db.select.mockResolvedValueOnce([
      { feature_key: 'commission_rate', value: '0.1' },
    ]);

    const amt = await calculateInstructorAmount('plan2', 'item2');
    expect(amt).toBeCloseTo(5);
  });

  it('returns 0 when plan not found', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 1 })
      .mockResolvedValueOnce(null);
    const amt = await calculateInstructorAmount('planX', 'itemX');
    expect(amt).toBe(0);
  });
});
